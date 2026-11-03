package com.ridenexa.driver;

import com.ridenexa.core.ApiException;
import com.ridenexa.security.CurrentUser;
import com.ridenexa.security.UserSession;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DriverService {
    private final JdbcTemplate jdbc;
    private final CurrentUser current;

    public DriverService(JdbcTemplate jdbc, CurrentUser current) {
        this.jdbc = jdbc;
        this.current = current;
    }

    public List<Map<String, Object>> myTrips() {
        UserSession user = current.require();
        return jdbc.queryForList(
            "SELECT dt.*, b.start_at, b.end_at, b.pickup_address, b.destination_address, b.quoted_total, " +
            "v.make, v.model, v.registration_number, u.full_name AS customer_name, u.phone AS customer_phone " +
            "FROM driver_trips dt " +
            "JOIN bookings b ON b.id = dt.booking_id " +
            "JOIN vehicles v ON v.id = b.vehicle_id " +
            "JOIN users u ON u.id = b.customer_id " +
            "WHERE dt.driver_id = ? ORDER BY dt.created_at DESC", user.id()
        );
    }

    public Map<String, Object> trip(String id) {
        current.require();
        List<Map<String, Object>> rows = jdbc.queryForList(
            "SELECT dt.*, b.start_at, b.end_at, b.pickup_address, b.destination_address, b.quoted_total, " +
            "v.make, v.model, v.registration_number, u.full_name AS customer_name, u.phone AS customer_phone " +
            "FROM driver_trips dt " +
            "JOIN bookings b ON b.id = dt.booking_id " +
            "JOIN vehicles v ON v.id = b.vehicle_id " +
            "JOIN users u ON u.id = b.customer_id " +
            "WHERE dt.id = ?", id
        );
        if (rows.isEmpty()) throw new ApiException(HttpStatus.NOT_FOUND, "Trip assignment not found.");
        return rows.getFirst();
    }

    @Transactional
    public Map<String, Object> updateTrip(String id, DriverDtos.UpdateTripRequest input) {
        UserSession user = current.require();
        String newStatus = input.status().trim().toUpperCase();
        jdbc.update(
            "UPDATE driver_trips SET status = ?, end_odometer = COALESCE(?, end_odometer), notes = COALESCE(?, notes) WHERE id = ? AND driver_id = ?",
            newStatus, input.endOdometer(), input.notes(), id, user.id()
        );
        Map<String, Object> trip = trip(id);
        String bookingId = (String) trip.get("booking_id");
        if ("COMPLETED".equals(newStatus)) {
            jdbc.update("UPDATE bookings SET status = 'COMPLETED' WHERE id = ?", bookingId);
            jdbc.update("UPDATE vehicles SET status = 'AVAILABLE' WHERE id = (SELECT vehicle_id FROM bookings WHERE id = ?)", bookingId);
            jdbc.update("INSERT INTO booking_messages (id, booking_id, sender_id, sender_role, message) VALUES (?, ?, NULL, 'SYSTEM', ?)",
                    UUID.randomUUID().toString(), bookingId, "Chauffeur trip completed. Thank you for riding with RideNexa!");
        }
        return trip(id);
    }
}
