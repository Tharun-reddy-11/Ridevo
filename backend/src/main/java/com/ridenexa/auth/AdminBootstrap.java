package com.ridenexa.auth;

import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class AdminBootstrap implements CommandLineRunner {
    private final JdbcTemplate jdbc; private final PasswordEncoder encoder; private final String email; private final String password;
    public AdminBootstrap(JdbcTemplate jdbc, PasswordEncoder encoder, @Value("${ridenexa.admin-email}") String email, @Value("${ridenexa.admin-password}") String password) { this.jdbc = jdbc; this.encoder = encoder; this.email = email; this.password = password; }
    @Override public void run(String... args) {
        if (email == null || email.isBlank() || password == null || password.isBlank()) return;
        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM users WHERE email = ?", Integer.class, email.trim().toLowerCase());
        if (count != null && count == 0) jdbc.update("INSERT INTO users (id,email,password_hash,role,full_name,phone,city) VALUES (?,?,?,?,?,?,?)", UUID.randomUUID().toString(), email.trim().toLowerCase(), encoder.encode(password), "ADMIN", "RideNexa Administrator", "Not configured", "Platform");
    }
}
