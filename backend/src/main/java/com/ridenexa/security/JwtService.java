package com.ridenexa.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class JwtService {
    private final SecretKey key;
    public JwtService(@Value("${ridenexa.jwt-secret}") String secret) {
        if (secret.length() < 32) throw new IllegalStateException("JWT_SECRET must contain at least 32 characters.");
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }
    public String create(UserSession user) {
        Instant now = Instant.now();
        return Jwts.builder().subject(user.id()).claim("email", user.email()).claim("role", user.role()).claim("name", user.fullName())
                .issuedAt(Date.from(now)).expiration(Date.from(now.plusSeconds(60 * 60 * 12))).signWith(key).compact();
    }
    public UserSession parse(String token) {
        Claims claims = Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
        return new UserSession(claims.getSubject(), claims.get("email", String.class), claims.get("role", String.class), claims.get("name", String.class));
    }
}
