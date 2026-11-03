package com.ridenexa.notification;

import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {
    private final NotificationService notifications;

    public NotificationController(NotificationService notifications) {
        this.notifications = notifications;
    }

    @GetMapping
    public List<Map<String, Object>> myNotifications() {
        return notifications.myNotifications();
    }

    @PatchMapping("/{id}/read")
    public Map<String, Object> markAsRead(@PathVariable String id) {
        return notifications.markAsRead(id);
    }
}
