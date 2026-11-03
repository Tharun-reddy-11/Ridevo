package com.ridenexa.notification;

import com.ridenexa.security.CurrentUser;
import com.ridenexa.security.UserSession;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {
    private final JdbcTemplate jdbc;
    private final CurrentUser current;

    public NotificationService(JdbcTemplate jdbc, CurrentUser current) {
        this.jdbc = jdbc;
        this.current = current;
    }

    public List<Map<String, Object>> myNotifications() {
        UserSession user = current.require();
        return jdbc.queryForList(
            "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 25", user.id()
        );
    }

    public Map<String, Object> markAsRead(String id) {
        UserSession user = current.require();
        jdbc.update("UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?", id, user.id());
        return Map.of("id", id, "status", "READ");
    }

    public void send(String userId, String title, String message, String type) {
        jdbc.update(
            "INSERT INTO notifications (id, user_id, title, message, notification_type) VALUES (?, ?, ?, ?, ?)",
            UUID.randomUUID().toString(), userId, title, message, type != null ? type : "SYSTEM"
        );
    }
}
