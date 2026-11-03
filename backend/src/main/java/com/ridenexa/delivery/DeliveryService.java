package com.ridenexa.delivery;

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
public class DeliveryService {
    private final JdbcTemplate jdbc;
    private final CurrentUser current;
    private final SecureRandom random = new SecureRandom();

    public DeliveryService(JdbcTemplate jdbc, CurrentUser current) {
        this.jdbc = jdbc;
        this.current = current;
    }

    public List<Map<String, Object>> myTasks() {
        UserSession user = current.require();
        String role = user.role();
        if ("DELIVERY".equals(role)) {
            return jdbc.queryForList(
                "SELECT dt.*, b.start_at, b.end_at, b.delivery_address, b.delivery_method, b.return_method, " +
                "b.quoted_total, b.status AS booking_status, v.make, v.model, v.registration_number, v.vehicle_type, " +
                "u.full_name AS customer_name, u.phone AS customer_phone " +
                "FROM delivery_tasks dt " +
                "JOIN bookings b ON b.id = dt.booking_id " +
                "JOIN vehicles v ON v.id = b.vehicle_id " +
                "JOIN users u ON u.id = b.customer_id " +
                "WHERE (dt.assigned_to = ? OR dt.assigned_to IS NULL) " +
                "ORDER BY dt.created_at DESC", user.id()
            );
        } else if ("OWNER".equals(role)) {
            return jdbc.queryForList(
                "SELECT dt.*, b.start_at, b.end_at, b.delivery_address, b.delivery_method, b.return_method, " +
                "b.quoted_total, b.status AS booking_status, v.make, v.model, v.registration_number, v.vehicle_type, " +
                "u.full_name AS customer_name, u.phone AS customer_phone, staff.full_name AS assigned_staff_name " +
                "FROM delivery_tasks dt " +
                "JOIN bookings b ON b.id = dt.booking_id " +
                "JOIN vehicles v ON v.id = b.vehicle_id " +
                "JOIN users u ON u.id = b.customer_id " +
                "LEFT JOIN users staff ON staff.id = dt.assigned_to " +
                "WHERE v.owner_id = ? " +
                "ORDER BY dt.created_at DESC", user.id()
            );
        } else if ("ADMIN".equals(role)) {
            return jdbc.queryForList(
                "SELECT dt.*, b.start_at, b.end_at, b.delivery_address, b.delivery_method, b.return_method, " +
                "b.quoted_total, b.status AS booking_status, v.make, v.model, v.registration_number, v.vehicle_type, " +
                "u.full_name AS customer_name, u.phone AS customer_phone, staff.full_name AS assigned_staff_name " +
                "FROM delivery_tasks dt " +
                "JOIN bookings b ON b.id = dt.booking_id " +
                "JOIN vehicles v ON v.id = b.vehicle_id " +
                "JOIN users u ON u.id = b.customer_id " +
                "LEFT JOIN users staff ON staff.id = dt.assigned_to " +
                "ORDER BY dt.created_at DESC"
            );
        }
        throw new ApiException(HttpStatus.FORBIDDEN, "Access to delivery tasks is restricted to operations staff and owners.");
    }

    public Map<String, Object> task(String id) {
        current.require();
        List<Map<String, Object>> rows = jdbc.queryForList(
            "SELECT dt.*, b.start_at, b.end_at, b.delivery_address, b.pickup_address, b.delivery_method, b.return_method, " +
            "b.quoted_total, b.status AS booking_status, v.id AS vehicle_id, v.make, v.model, v.registration_number, v.vehicle_type, v.hourly_rate, v.daily_rate, " +
            "u.full_name AS customer_name, u.phone AS customer_phone, u.id AS customer_id " +
            "FROM delivery_tasks dt " +
            "JOIN bookings b ON b.id = dt.booking_id " +
            "JOIN vehicles v ON v.id = b.vehicle_id " +
            "JOIN users u ON u.id = b.customer_id " +
            "WHERE dt.id = ?", id
        );
        if (rows.isEmpty()) throw new ApiException(HttpStatus.NOT_FOUND, "Delivery task not found.");
        return rows.getFirst();
    }

    @Transactional
    public Map<String, Object> updateStatus(String id, DeliveryDtos.UpdateStatusRequest input) {
        UserSession user = current.require();
        Map<String, Object> task = task(id);
        String newStatus = input.status().trim().toUpperCase();
        
        jdbc.update("UPDATE delivery_tasks SET status = ?, assigned_to = COALESCE(assigned_to, ?) WHERE id = ?", newStatus, user.id(), id);
        
        if ("ARRIVED".equals(newStatus)) {
            jdbc.update("UPDATE delivery_tasks SET staff_arrival_time = NOW() WHERE id = ?", id);
            systemMessage((String) task.get("booking_id"), "Delivery partner has arrived at the location.");
        } else if ("IN_TRANSIT".equals(newStatus)) {
            systemMessage((String) task.get("booking_id"), "Vehicle is on the way to your location.");
        }
        
        return task(id);
    }

    @Transactional
    public Map<String, Object> verifyLicence(String id, DeliveryDtos.VerifyLicenceRequest input) {
        current.require();
        Map<String, Object> task = task(id);
        if ("COMPLETED".equals(task.get("status"))) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Task is already completed.");
        }
        jdbc.update("UPDATE delivery_tasks SET licence_verified = TRUE, licence_number = ? WHERE id = ?", input.licenceNumber().trim().toUpperCase(), id);
        systemMessage((String) task.get("booking_id"), "Customer driving licence physically verified at handover.");
        return task(id);
    }

    @Transactional
    public Map<String, Object> handover(String id, DeliveryDtos.HandoverRequest input) {
        UserSession user = current.require();
        Map<String, Object> task = task(id);

        if (!Boolean.TRUE.equals(task.get("licence_verified"))) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Driving licence must be physically verified before releasing the vehicle.");
        }

        String expectedOtp = (String) task.get("handover_otp");
        if (expectedOtp != null && !expectedOtp.trim().equalsIgnoreCase(input.otp().trim())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid handover OTP. Please verify with the customer.");
        }

        String bookingId = (String) task.get("booking_id");
        String vehicleId = (String) task.get("vehicle_id");

        // Complete delivery task
        jdbc.update(
            "UPDATE delivery_tasks SET status = 'COMPLETED', odometer_reading = ?, fuel_percent = ?, inspection_notes = ?, completed_at = NOW(), assigned_to = COALESCE(assigned_to, ?) WHERE id = ?",
            input.odometerReading(), input.fuelPercent(), blank(input.inspectionNotes()), user.id(), id
        );

        // Update booking to ACTIVE
        jdbc.update("UPDATE bookings SET status = 'ACTIVE' WHERE id = ?", bookingId);

        // Update vehicle to RENTED
        jdbc.update("UPDATE vehicles SET status = 'RENTED' WHERE id = ?", vehicleId);

        // Record interaction for ML
        jdbc.update("INSERT INTO vehicle_interactions (user_id, vehicle_id, event_type) VALUES (?, ?, 'HANDOVER_COMPLETED')", task.get("customer_id"), vehicleId);

        systemMessage(bookingId, "Vehicle handover complete! Odometer: " + input.odometerReading() + " km, Fuel: " + input.fuelPercent() + "%. Enjoy your ride!");

        return task(id);
    }

    @Transactional
    public Map<String, Object> returnInspection(String id, DeliveryDtos.ReturnInspectionRequest input) {
        UserSession user = current.require();
        Map<String, Object> task = task(id);
        String bookingId = (String) task.get("booking_id");
        String vehicleId = (String) task.get("vehicle_id");

        // Complete return task
        jdbc.update(
            "UPDATE delivery_tasks SET status = 'COMPLETED', odometer_reading = ?, fuel_percent = ?, inspection_notes = ?, completed_at = NOW(), assigned_to = COALESCE(assigned_to, ?) WHERE id = ?",
            input.odometerReading(), input.fuelPercent(), blank(input.inspectionNotes()), user.id(), id
        );

        // Calculate late fee if applicable
        LocalDateTime endAt = asLocalDateTime(task.get("end_at"));
        LocalDateTime now = LocalDateTime.now();
        BigDecimal lateFee = BigDecimal.ZERO;
        
        // 15-minute grace period
        if (now.isAfter(endAt.plusMinutes(15))) {
            boolean isCustomerDelay = input.customerDelay() == null || input.customerDelay();
            if (isCustomerDelay) {
                long delayMinutes = Duration.between(endAt, now).toMinutes();
                BigDecimal delayHours = BigDecimal.valueOf(delayMinutes).divide(BigDecimal.valueOf(60), 0, RoundingMode.CEILING);
                BigDecimal hourlyRate = (BigDecimal) task.get("hourly_rate");
                lateFee = delayHours.multiply(hourlyRate != null ? hourlyRate : BigDecimal.valueOf(150));
            }
        }

        BigDecimal quotedTotal = (BigDecimal) task.get("quoted_total");
        BigDecimal totalDue = quotedTotal.add(lateFee);

        // Generate / Update final Invoice
        String invoiceId = UUID.randomUUID().toString();
        jdbc.update(
            "INSERT INTO invoices (id, booking_id, customer_id, base_amount, tax_amount, delivery_fee, late_fee, fuel_charge, deposit_deducted, total_amount, amount_paid, balance_due, status) " +
            "VALUES (?, ?, ?, ?, 0, 0, ?, 0, 0, ?, ?, 0, 'PAID')",
            invoiceId, bookingId, task.get("customer_id"), quotedTotal, lateFee, totalDue, totalDue
        );

        // Mark booking COMPLETED
        jdbc.update("UPDATE bookings SET status = 'COMPLETED' WHERE id = ?", bookingId);

        // Mark vehicle AVAILABLE
        jdbc.update("UPDATE vehicles SET status = 'AVAILABLE' WHERE id = ?", vehicleId);

        systemMessage(bookingId, "Return inspection completed successfully. Return Odometer: " + input.odometerReading() + " km, Fuel: " + input.fuelPercent() + "%" +
            (lateFee.compareTo(BigDecimal.ZERO) > 0 ? ". Late fee applied: ₹" + lateFee : ". No late fee applied."));

        return task(id);
    }

    public String generateOtp() {
        return String.format("%06d", random.nextInt(900000) + 100000);
    }

    private void systemMessage(String bookingId, String message) {
        jdbc.update("INSERT INTO booking_messages (id, booking_id, sender_id, sender_role, message) VALUES (?, ?, NULL, 'SYSTEM', ?)",
                UUID.randomUUID().toString(), bookingId, message);
    }

    private String blank(String value) { return value == null || value.isBlank() ? null : value.trim(); }

    private LocalDateTime asLocalDateTime(Object value) {
        if (value instanceof LocalDateTime timestamp) return timestamp;
        if (value instanceof java.sql.Timestamp timestamp) return timestamp.toLocalDateTime();
        return LocalDateTime.now();
    }
}
