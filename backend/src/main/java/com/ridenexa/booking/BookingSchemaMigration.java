package com.ridenexa.booking;

import jakarta.annotation.PostConstruct;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Keeps already-created local RideNexa databases compatible without dropping a
 * customer's booking history. MySQL versions differ in support for ADD COLUMN
 * IF NOT EXISTS, so the column check is deliberately performed in Java.
 */
@Component
public class BookingSchemaMigration {
    private final JdbcTemplate jdbc;

    public BookingSchemaMigration(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    @PostConstruct
    void upgradeExistingBookings() {
        addWhenMissing("pickup_address", "ALTER TABLE bookings ADD COLUMN pickup_address VARCHAR(500) NULL AFTER rental_mode");
        addWhenMissing("destination_address", "ALTER TABLE bookings ADD COLUMN destination_address VARCHAR(500) NULL AFTER pickup_address");
        addWhenMissing("driver_required", "ALTER TABLE bookings ADD COLUMN driver_required BOOLEAN NOT NULL DEFAULT FALSE AFTER destination_address");
    }

    private void addWhenMissing(String column, String statement) {
        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'bookings' AND column_name = ?", Integer.class, column);
        if (count != null && count == 0) jdbc.execute(statement);
    }
}
