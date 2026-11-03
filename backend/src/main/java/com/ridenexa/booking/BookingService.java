package com.ridenexa.booking;

import com.ridenexa.core.ApiException;
import com.ridenexa.security.CurrentUser;
import com.ridenexa.security.UserSession;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BookingService {
    private final JdbcTemplate jdbc;
    private final CurrentUser current;
    private final SecureRandom random = new SecureRandom();

    public BookingService(JdbcTemplate jdbc, CurrentUser current) {
        this.jdbc = jdbc;
        this.current = current;
    }

    public Map<String, Object> calculateQuote(BookingDtos.QuoteRequest input) {
        Map<String, Object> vehicle = vehicle(input.vehicleId());
        BigDecimal hourly = (BigDecimal) vehicle.get("hourly_rate");
        BigDecimal daily = (BigDecimal) vehicle.get("daily_rate");
        BigDecimal deposit = (BigDecimal) vehicle.get("security_deposit");

        long minutes = Math.max(15, Duration.between(input.startAt(), input.endAt()).toMinutes());
        BigDecimal hours = BigDecimal.valueOf(minutes).divide(BigDecimal.valueOf(60), 0, RoundingMode.CEILING);
        BigDecimal days = BigDecimal.valueOf(minutes).divide(BigDecimal.valueOf(1440), 0, RoundingMode.CEILING);
        BigDecimal rentalAmount = hourly.multiply(hours).min(daily.multiply(days));

        // Default transparent policy: GST (18%) and Toll/FASTag are already bundled
        BigDecimal includedGst = rentalAmount.multiply(BigDecimal.valueOf(0.18)).divide(BigDecimal.valueOf(1.18), 2, RoundingMode.HALF_UP);
        BigDecimal includedToll = BigDecimal.valueOf(150.00);

        BigDecimal deliveryFee = "DOORSTEP".equalsIgnoreCase(input.deliveryMethod()) ? BigDecimal.valueOf(100.00) : BigDecimal.ZERO;
        BigDecimal driverFee = Boolean.TRUE.equals(input.driverRequired()) ? BigDecimal.valueOf(400.00).multiply(hours.max(BigDecimal.ONE)) : BigDecimal.ZERO;

        BigDecimal totalPayable = rentalAmount.add(deliveryFee).add(driverFee);

        return Map.of(
            "rentalAmount", rentalAmount,
            "includedGst", includedGst,
            "includedToll", includedToll,
            "deliveryFee", deliveryFee,
            "driverFee", driverFee,
            "securityDeposit", deposit != null ? deposit : BigDecimal.ZERO,
            "totalPayableAtHandover", totalPayable,
            "totalHours", hours,
            "totalDays", days
        );
    }

    @Transactional
    public Map<String, Object> request(BookingDtos.BookingRequest input) {
        UserSession user = current.requireRole("CUSTOMER");
        if (!input.endAt().isAfter(input.startAt()) || input.startAt().isBefore(LocalDateTime.now().minusMinutes(5))) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Select a valid future rental period.");
        }
        Map<String, Object> vehicle = vehicle(input.vehicleId());
        if (hasConflict(input.vehicleId(), input.startAt(), input.endAt(), null)) {
            throw new ApiException(HttpStatus.CONFLICT, "This vehicle is no longer available for the selected time.");
        }

        BigDecimal total = quoteAmount((BigDecimal) vehicle.get("hourly_rate"), (BigDecimal) vehicle.get("daily_rate"), input.startAt(), input.endAt());
        String id = UUID.randomUUID().toString();

        jdbc.update(
            "INSERT INTO bookings (id, vehicle_id, customer_id, start_at, end_at, delivery_method, return_method, rental_mode, delivery_address, pickup_address, destination_address, driver_required, quoted_total, status) " +
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'REQUESTED')",
            id, input.vehicleId(), user.id(), input.startAt(), input.endAt(),
            input.deliveryMethod().trim().toUpperCase(), input.returnMethod().trim().toUpperCase(),
            input.rentalMode().trim().toUpperCase(), input.pickupAddress().trim(),
            input.pickupAddress().trim(), input.destinationAddress().trim(),
            input.driverRequired(), total
        );

        jdbc.update("INSERT INTO vehicle_interactions (user_id, vehicle_id, event_type) VALUES (?, ?, 'BOOKING_REQUEST')", user.id(), input.vehicleId());
        systemMessage(id, "Your booking request was sent to the rental owner. You will receive their decision here.");

        return detailedBooking(id);
    }

    public List<Map<String, Object>> customerBookings() {
        return bookings("b.customer_id=?", current.requireRole("CUSTOMER").id());
    }

    public List<Map<String, Object>> ownerBookings() {
        return bookings("v.owner_id=?", current.requireRole("OWNER").id());
    }

    public Map<String, Object> bookingById(String id) {
        accessBooking(id);
        return detailedBooking(id);
    }

    @Transactional
    public Map<String, Object> decide(String bookingId, BookingDtos.BookingDecision decision) {
        UserSession owner = current.requireRole("OWNER");
        Map<String, Object> booking = jdbc.queryForMap(
            "SELECT b.*, v.hourly_rate FROM bookings b JOIN vehicles v ON v.id=b.vehicle_id WHERE b.id=? AND v.owner_id=?",
            bookingId, owner.id()
        );

        if (!"REQUESTED".equals(booking.get("status"))) {
            throw new ApiException(HttpStatus.CONFLICT, "Only requested bookings can be decided.");
        }

        if ("APPROVED".equals(decision.status())) {
            if (hasConflict((String) booking.get("vehicle_id"), asLocalDateTime(booking.get("start_at")), asLocalDateTime(booking.get("end_at")), bookingId)) {
                throw new ApiException(HttpStatus.CONFLICT, "This vehicle has another reservation in this time period.");
            }

            jdbc.update("UPDATE bookings SET status='APPROVED', owner_note=? WHERE id=?", blank(decision.note()), bookingId);

            // Generate 6-digit Handover OTP
            String otp = String.format("%06d", random.nextInt(900000) + 100000);

            // Create Delivery Task for operations
            String taskId = UUID.randomUUID().toString();
            jdbc.update(
                "INSERT INTO delivery_tasks (id, booking_id, task_type, status, handover_otp) VALUES (?, ?, 'DELIVERY', 'ASSIGNED', ?)",
                taskId, bookingId, otp
            );

            // Create initial pending invoice
            String invoiceId = UUID.randomUUID().toString();
            jdbc.update(
                "INSERT INTO invoices (id, booking_id, customer_id, base_amount, total_amount, balance_due, status) VALUES (?, ?, ?, ?, ?, ?, 'PENDING')",
                invoiceId, bookingId, booking.get("customer_id"), booking.get("quoted_total"), booking.get("quoted_total"), booking.get("quoted_total")
            );

            systemMessage(bookingId, "Your booking was accepted! Your handover OTP is " + otp + ". Present this OTP and your driving licence at vehicle handover.");
        } else {
            jdbc.update("UPDATE bookings SET status='REJECTED', owner_note=? WHERE id=?", blank(decision.note()), bookingId);
            systemMessage(bookingId, "The rental owner declined this request. Please explore another available vehicle.");
        }

        return detailedBooking(bookingId);
    }

    public Map<String, Object> returnOptions(String bookingId) {
        accessBooking(bookingId);
        Map<String, Object> booking = detailedBooking(bookingId);
        return Map.of(
            "bookingId", bookingId,
            "scheduledEndAt", booking.get("end_at"),
            "currentReturnMethod", booking.get("return_method"),
            "allowedOptions", List.of("SHOP_RETURN", "DOORSTEP_PICKUP"),
            "gracePeriodMinutes", 15,
            "lateHourlyRate", booking.get("hourly_rate") != null ? booking.get("hourly_rate") : 150,
            "shopAddress", booking.get("shop_address") != null ? booking.get("shop_address") : "Main Shop Location"
        );
    }

    @Transactional
    public Map<String, Object> returnChoice(String bookingId, BookingDtos.ReturnChoiceRequest input) {
        accessBooking(bookingId);
        String method = input.returnMethod().trim().toUpperCase();
        jdbc.update("UPDATE bookings SET return_method = ? WHERE id = ?", method, bookingId);

        if ("DOORSTEP_PICKUP".equals(method)) {
            String taskId = UUID.randomUUID().toString();
            jdbc.update(
                "INSERT INTO delivery_tasks (id, booking_id, task_type, status) VALUES (?, ?, 'PICKUP', 'ASSIGNED')",
                taskId, bookingId
            );
            systemMessage(bookingId, "Doorstep collection requested for " + (input.returnAddress() != null ? input.returnAddress() : "your registered address") + ". A staff member will arrive to inspect and collect the vehicle.");
        } else {
            systemMessage(bookingId, "Shop return confirmed. Please return the vehicle to the rental shop by " + detailedBooking(bookingId).get("end_at") + ".");
        }

        return detailedBooking(bookingId);
    }

    public Map<String, Object> lateFeePreview(String bookingId) {
        accessBooking(bookingId);
        Map<String, Object> booking = detailedBooking(bookingId);
        LocalDateTime endAt = asLocalDateTime(booking.get("end_at"));
        LocalDateTime now = LocalDateTime.now();

        long delayMinutes = Math.max(0, Duration.between(endAt, now).toMinutes());
        long billableHours = 0;
        BigDecimal lateFee = BigDecimal.ZERO;
        BigDecimal hourlyRate = booking.get("hourly_rate") instanceof BigDecimal bd ? bd : BigDecimal.valueOf(150);

        if (delayMinutes > 15) { // 15-minute grace period
            billableHours = (long) Math.ceil((double) delayMinutes / 60.0);
            lateFee = hourlyRate.multiply(BigDecimal.valueOf(billableHours));
        }

        return Map.of(
            "bookingId", bookingId,
            "endAt", endAt,
            "currentTimestamp", now,
            "delayMinutes", delayMinutes,
            "gracePeriodMinutes", 15,
            "billableHours", billableHours,
            "hourlyRate", hourlyRate,
            "estimatedLateFee", lateFee
        );
    }

    public List<Map<String, Object>> messages(String bookingId) {
        accessBooking(bookingId);
        return jdbc.queryForList(
            "SELECT m.id, m.booking_id, m.sender_role, m.message, m.created_at, COALESCE(u.full_name, 'RideNexa') AS sender_name " +
            "FROM booking_messages m LEFT JOIN users u ON u.id=m.sender_id WHERE m.booking_id=? ORDER BY m.created_at ASC", bookingId
        );
    }

    @Transactional
    public Map<String, Object> sendMessage(String bookingId, BookingDtos.MessageRequest input) {
        UserSession user = accessBooking(bookingId);
        String id = UUID.randomUUID().toString();
        jdbc.update("INSERT INTO booking_messages (id, booking_id, sender_id, sender_role, message) VALUES (?, ?, ?, ?, ?)",
                id, bookingId, user.id(), user.role(), input.message().trim());
        return jdbc.queryForMap(
            "SELECT m.id, m.booking_id, m.sender_role, m.message, m.created_at, u.full_name AS sender_name " +
            "FROM booking_messages m JOIN users u ON u.id=m.sender_id WHERE m.id=?", id
        );
    }

    public Map<String, Object> dashboard() {
        UserSession user = current.require();
        if ("CUSTOMER".equals(user.role())) {
            return Map.of(
                "role", "CUSTOMER",
                "bookings", count("SELECT COUNT(*) FROM bookings WHERE customer_id=?", user.id()),
                "pending", count("SELECT COUNT(*) FROM bookings WHERE customer_id=? AND status='REQUESTED'", user.id()),
                "active", count("SELECT COUNT(*) FROM bookings WHERE customer_id=? AND status='ACTIVE'", user.id())
            );
        }
        if ("OWNER".equals(user.role())) {
            return Map.of(
                "role", "OWNER",
                "vehicles", count("SELECT COUNT(*) FROM vehicles WHERE owner_id=?", user.id()),
                "bookingRequests", count("SELECT COUNT(*) FROM bookings b JOIN vehicles v ON v.id=b.vehicle_id WHERE v.owner_id=? AND b.status='REQUESTED'", user.id()),
                "activeRentals", count("SELECT COUNT(*) FROM bookings b JOIN vehicles v ON v.id=b.vehicle_id WHERE v.owner_id=? AND b.status='ACTIVE'", user.id()),
                "approvalStatus", ownerStatus(user.id())
            );
        }
        if ("ADMIN".equals(user.role())) {
            return Map.of(
                "role", "ADMIN",
                "users", count("SELECT COUNT(*) FROM users"),
                "pendingOwnerApplications", count("SELECT COUNT(*) FROM rental_owner_applications WHERE status='PENDING'"),
                "vehicles", count("SELECT COUNT(*) FROM vehicles"),
                "bookingRequests", count("SELECT COUNT(*) FROM bookings WHERE status='REQUESTED'"),
                "activeRentals", count("SELECT COUNT(*) FROM bookings WHERE status='ACTIVE'")
            );
        }
        return Map.of("role", user.role());
    }

    private List<Map<String, Object>> bookings(String condition, Object argument) {
        return jdbc.queryForList(
            "SELECT b.*, v.make, v.model, v.image_url, v.vehicle_type, v.hourly_rate, v.daily_rate, v.registration_number, " +
            "u.full_name AS customer_name, u.phone AS customer_phone, " +
            "dt.handover_otp, dt.status AS delivery_status, dt.licence_verified, dt.licence_number " +
            "FROM bookings b " +
            "JOIN vehicles v ON v.id = b.vehicle_id " +
            "JOIN users u ON u.id = b.customer_id " +
            "LEFT JOIN delivery_tasks dt ON dt.booking_id = b.id AND dt.task_type = 'DELIVERY' " +
            "WHERE " + condition + " ORDER BY b.created_at DESC", argument
        );
    }

    private Map<String, Object> detailedBooking(String id) {
        List<Map<String, Object>> list = jdbc.queryForList(
            "SELECT b.*, v.make, v.model, v.image_url, v.vehicle_type, v.hourly_rate, v.daily_rate, v.registration_number, " +
            "u.full_name AS customer_name, u.phone AS customer_phone, " +
            "a.business_name, a.address_line AS shop_address, " +
            "dt.handover_otp, dt.status AS delivery_status, dt.licence_verified, dt.licence_number " +
            "FROM bookings b " +
            "JOIN vehicles v ON v.id = b.vehicle_id " +
            "JOIN users u ON u.id = b.customer_id " +
            "LEFT JOIN rental_owner_applications a ON a.user_id = v.owner_id " +
            "LEFT JOIN delivery_tasks dt ON dt.booking_id = b.id AND dt.task_type = 'DELIVERY' " +
            "WHERE b.id = ?", id
        );
        if (list.isEmpty()) throw new ApiException(HttpStatus.NOT_FOUND, "Booking not found.");
        return list.getFirst();
    }

    private UserSession accessBooking(String bookingId) {
        UserSession user = current.require();
        List<Map<String, Object>> rows = jdbc.queryForList(
            "SELECT b.customer_id, v.owner_id FROM bookings b JOIN vehicles v ON v.id=b.vehicle_id WHERE b.id=?", bookingId
        );
        if (rows.isEmpty()) throw new ApiException(HttpStatus.NOT_FOUND, "Booking not found.");
        Map<String, Object> booking = rows.getFirst();
        boolean allowed = "ADMIN".equals(user.role()) || "DELIVERY".equals(user.role()) || "DRIVER".equals(user.role()) ||
                ("CUSTOMER".equals(user.role()) && user.id().equals(booking.get("customer_id"))) ||
                ("OWNER".equals(user.role()) && user.id().equals(booking.get("owner_id")));
        if (!allowed) throw new ApiException(HttpStatus.FORBIDDEN, "You do not have access to this booking.");
        return user;
    }

    private void systemMessage(String bookingId, String message) {
        jdbc.update("INSERT INTO booking_messages (id, booking_id, sender_id, sender_role, message) VALUES (?, ?, NULL, 'SYSTEM', ?)",
                UUID.randomUUID().toString(), bookingId, message);
    }

    private Map<String, Object> vehicle(String id) {
        try {
            return jdbc.queryForMap("SELECT * FROM vehicles WHERE id=? AND status='AVAILABLE'", id);
        } catch (Exception e) {
            throw new ApiException(HttpStatus.NOT_FOUND, "The selected vehicle does not exist or is not available.");
        }
    }

    private boolean hasConflict(String vehicleId, LocalDateTime start, LocalDateTime end, String excluding) {
        String sql = "SELECT COUNT(*) FROM bookings WHERE vehicle_id=? AND status IN ('REQUESTED','APPROVED','ACTIVE') AND start_at < ? AND end_at > ?" + (excluding == null ? "" : " AND id<>?");
        List<Object> args = new ArrayList<>(List.of(vehicleId, end, start));
        if (excluding != null) args.add(excluding);
        Integer result = jdbc.queryForObject(sql, Integer.class, args.toArray());
        return result != null && result > 0;
    }

    private BigDecimal quoteAmount(BigDecimal hourly, BigDecimal daily, LocalDateTime start, LocalDateTime end) {
        long minutes = Math.max(15, Duration.between(start, end).toMinutes());
        BigDecimal hours = BigDecimal.valueOf(minutes).divide(BigDecimal.valueOf(60), 0, RoundingMode.CEILING);
        BigDecimal hourlyQuote = hourly.multiply(hours);
        BigDecimal days = BigDecimal.valueOf(minutes).divide(BigDecimal.valueOf(1440), 0, RoundingMode.CEILING);
        return hourlyQuote.min(daily.multiply(days));
    }

    private long count(String sql, Object... args) {
        Long value = jdbc.queryForObject(sql, Long.class, args);
        return value == null ? 0 : value;
    }

    private String ownerStatus(String userId) {
        List<String> rows = jdbc.query("SELECT status FROM rental_owner_applications WHERE user_id=?", (rs, row) -> rs.getString(1), userId);
        return rows.isEmpty() ? "NOT_SUBMITTED" : rows.getFirst();
    }

    private String blank(String value) { return value == null || value.isBlank() ? null : value.trim(); }

    private LocalDateTime asLocalDateTime(Object value) {
        if (value instanceof LocalDateTime timestamp) return timestamp;
        if (value instanceof java.sql.Timestamp timestamp) return timestamp.toLocalDateTime();
        return LocalDateTime.now();
    }
}
