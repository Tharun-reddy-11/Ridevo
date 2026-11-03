package com.ridenexa.admin;

import com.ridenexa.booking.BookingDtos.OwnerDecision;
import com.ridenexa.core.ApiException;
import com.ridenexa.security.CurrentUser;
import com.ridenexa.security.UserSession;
import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminController {
    private final JdbcTemplate jdbc;
    private final CurrentUser current;

    public AdminController(JdbcTemplate jdbc, CurrentUser current) {
        this.jdbc = jdbc;
        this.current = current;
    }

    @GetMapping("/owner-applications")
    public List<Map<String, Object>> applications() {
        current.requireRole("ADMIN");
        return jdbc.queryForList(
            "SELECT a.*, u.full_name, u.email, u.phone, u.city " +
            "FROM rental_owner_applications a JOIN users u ON u.id = a.user_id " +
            "ORDER BY CASE WHEN a.status = 'PENDING' THEN 0 ELSE 1 END, a.created_at DESC"
        );
    }

    @Transactional
    @PatchMapping("/owner-applications/{id}")
    public Map<String, Object> decide(@PathVariable String id, @Valid @RequestBody OwnerDecision input) {
        UserSession admin = current.requireRole("ADMIN");
        int changed = jdbc.update(
            "UPDATE rental_owner_applications SET status = ?, review_note = ?, reviewed_by = ?, reviewed_at = ? WHERE id = ? AND status = 'PENDING'",
            input.status(), input.note(), admin.id(), OffsetDateTime.now(), id
        );
        if (changed == 0) throw new ApiException(HttpStatus.CONFLICT, "This application was already reviewed or does not exist.");
        return jdbc.queryForMap("SELECT * FROM rental_owner_applications WHERE id = ?", id);
    }

    @GetMapping("/users")
    public List<Map<String, Object>> users() {
        current.requireRole("ADMIN");
        return jdbc.queryForList("SELECT id, email, role, full_name, phone, city, created_at FROM users ORDER BY created_at DESC");
    }

    @GetMapping("/vehicles")
    public List<Map<String, Object>> vehicles() {
        current.requireRole("ADMIN");
        return jdbc.queryForList(
            "SELECT v.*, a.business_name, u.full_name as owner_name " +
            "FROM vehicles v " +
            "JOIN users u ON u.id = v.owner_id " +
            "LEFT JOIN rental_owner_applications a ON a.user_id = v.owner_id " +
            "ORDER BY v.created_at DESC"
        );
    }

    @GetMapping("/bookings")
    public List<Map<String, Object>> bookings() {
        current.requireRole("ADMIN");
        return jdbc.queryForList(
            "SELECT b.*, v.make, v.model, v.registration_number, u.full_name as customer_name, a.business_name " +
            "FROM bookings b " +
            "JOIN vehicles v ON v.id = b.vehicle_id " +
            "JOIN users u ON u.id = b.customer_id " +
            "LEFT JOIN rental_owner_applications a ON a.user_id = v.owner_id " +
            "ORDER BY b.created_at DESC"
        );
    }

    @GetMapping("/overview")
    public Map<String, Object> overview() {
        current.requireRole("ADMIN");
        BigDecimal totalRevenue = jdbc.queryForObject("SELECT COALESCE(SUM(amount_paid), 0) FROM invoices WHERE status = 'PAID'", BigDecimal.class);
        return Map.of(
            "totalRevenue", totalRevenue != null ? totalRevenue : BigDecimal.ZERO,
            "totalUsers", jdbc.queryForObject("SELECT COUNT(*) FROM users", Long.class),
            "totalVehicles", jdbc.queryForObject("SELECT COUNT(*) FROM vehicles", Long.class),
            "approvedShops", jdbc.queryForObject("SELECT COUNT(*) FROM rental_owner_applications WHERE status = 'APPROVED'", Long.class),
            "activeRentals", jdbc.queryForObject("SELECT COUNT(*) FROM bookings WHERE status = 'ACTIVE'", Long.class),
            "recentBookings", jdbc.queryForList(
                "SELECT b.*, v.make, v.model, u.full_name AS customer_name FROM bookings b JOIN vehicles v ON v.id = b.vehicle_id JOIN users u ON u.id = b.customer_id ORDER BY b.created_at DESC LIMIT 10"
            ),
            "pendingApplications", jdbc.queryForList(
                "SELECT a.*, u.full_name, u.email FROM rental_owner_applications a JOIN users u ON u.id = a.user_id WHERE a.status = 'PENDING' ORDER BY a.created_at ASC"
            )
        );
    }
}
