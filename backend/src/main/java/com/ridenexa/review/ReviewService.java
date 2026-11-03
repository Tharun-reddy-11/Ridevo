package com.ridenexa.review;

import com.ridenexa.core.ApiException;
import com.ridenexa.security.CurrentUser;
import com.ridenexa.security.UserSession;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReviewService {
    private final JdbcTemplate jdbc;
    private final CurrentUser current;

    public ReviewService(JdbcTemplate jdbc, CurrentUser current) {
        this.jdbc = jdbc;
        this.current = current;
    }

    @Transactional
    public Map<String, Object> create(ReviewDtos.CreateReviewRequest input) {
        UserSession user = current.requireRole("CUSTOMER");
        List<Map<String, Object>> rows = jdbc.queryForList(
            "SELECT b.*, v.id AS vehicle_id FROM bookings b JOIN vehicles v ON v.id = b.vehicle_id WHERE b.id = ? AND b.customer_id = ?",
            input.bookingId(), user.id()
        );
        if (rows.isEmpty()) throw new ApiException(HttpStatus.NOT_FOUND, "Booking not found.");
        Map<String, Object> booking = rows.getFirst();
        String bookingStatus = (String) booking.get("status");
        if (!"COMPLETED".equalsIgnoreCase(bookingStatus)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Reviews can only be submitted for completed rentals.");
        }

        String vehicleId = (String) booking.get("vehicle_id");
        Integer existing = jdbc.queryForObject("SELECT COUNT(*) FROM reviews WHERE booking_id = ?", Integer.class, input.bookingId());
        if (existing != null && existing > 0) {
            throw new ApiException(HttpStatus.CONFLICT, "You have already submitted a review for this booking.");
        }

        String id = UUID.randomUUID().toString();
        jdbc.update(
            "INSERT INTO reviews (id, booking_id, vehicle_id, customer_id, rating, comment) VALUES (?, ?, ?, ?, ?, ?)",
            id, input.bookingId(), vehicleId, user.id(), input.rating(), input.comment().trim()
        );

        // Update vehicle rating and review count
        Map<String, Object> stats = jdbc.queryForMap(
            "SELECT AVG(rating) as avg_rating, COUNT(*) as cnt FROM reviews WHERE vehicle_id = ?", vehicleId
        );
        Number avg = (Number) stats.get("avg_rating");
        Number cnt = (Number) stats.get("cnt");

        BigDecimal newRating = avg != null ? BigDecimal.valueOf(avg.doubleValue()).setScale(2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
        int newCount = cnt != null ? cnt.intValue() : 0;

        jdbc.update("UPDATE vehicles SET rating = ?, review_count = ? WHERE id = ?", newRating, newCount, vehicleId);

        // Record interaction for ML recommendation engine
        jdbc.update("INSERT INTO vehicle_interactions (user_id, vehicle_id, event_type) VALUES (?, ?, 'VEHICLE_RATED')", user.id(), vehicleId);

        return jdbc.queryForMap("SELECT r.*, u.full_name as customer_name FROM reviews r JOIN users u ON u.id = r.customer_id WHERE r.id = ?", id);
    }

    public List<Map<String, Object>> vehicleReviews(String vehicleId) {
        return jdbc.queryForList(
            "SELECT r.*, u.full_name AS customer_name, u.city AS customer_city " +
            "FROM reviews r JOIN users u ON u.id = r.customer_id WHERE r.vehicle_id = ? ORDER BY r.created_at DESC", vehicleId
        );
    }
}
