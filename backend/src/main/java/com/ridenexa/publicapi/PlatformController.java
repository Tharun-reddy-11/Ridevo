package com.ridenexa.publicapi;

import java.time.OffsetDateTime;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/public")
public class PlatformController {
    private final JdbcTemplate jdbcTemplate;

    public PlatformController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        Integer databaseCheck = jdbcTemplate.queryForObject("SELECT 1", Integer.class);
        return ResponseEntity.ok(Map.of(
                "service", "ridenexa-api",
                "phase", "marketplace-core",
                "status", databaseCheck == 1 ? "UP" : "DOWN",
                "timestamp", OffsetDateTime.now().toString()
        ));
    }
}
