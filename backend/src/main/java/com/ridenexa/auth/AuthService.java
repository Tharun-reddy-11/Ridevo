package com.ridenexa.auth;

import com.ridenexa.auth.AuthDtos.CustomerRegistration;
import com.ridenexa.auth.AuthDtos.LoginRequest;
import com.ridenexa.auth.AuthDtos.OwnerRegistration;
import com.ridenexa.auth.AuthDtos.StaffRegistration;
import com.ridenexa.core.ApiException;
import com.ridenexa.security.JwtService;
import com.ridenexa.security.UserSession;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private final JdbcTemplate jdbc;
    private final PasswordEncoder encoder;
    private final JwtService jwt;

    public AuthService(JdbcTemplate jdbc, PasswordEncoder encoder, JwtService jwt) {
        this.jdbc = jdbc;
        this.encoder = encoder;
        this.jwt = jwt;
    }

    @Transactional
    public Map<String, Object> registerCustomer(CustomerRegistration input) {
        return createUser(input.fullName(), input.email(), input.password(), input.phone(), input.city(), input.latitude(), input.longitude(), "CUSTOMER");
    }

    @Transactional
    public Map<String, Object> registerOwner(OwnerRegistration input) {
        Map<String, Object> account = createUser(input.fullName(), input.email(), input.password(), input.phone(), input.city(), input.latitude(), input.longitude(), "OWNER");
        String userId = ((Map<?, ?>) account.get("user")).get("id").toString();
        jdbc.update("INSERT INTO rental_owner_applications (id,user_id,business_name,business_phone,gst_number,address_line,service_radius_km,status,vehicle_types) VALUES (?,?,?,?,?,?,?, 'PENDING', ?)",
                UUID.randomUUID().toString(), userId, input.businessName().trim(), input.businessPhone().trim(), blankToNull(input.gstNumber()), input.addressLine().trim(), input.serviceRadiusKm() == null ? 15 : input.serviceRadiusKm(), input.vehicleTypes() == null ? "Bikes, Cars" : input.vehicleTypes());
        return Map.of(
            "message", "Rental owner application registered successfully! It is now pending admin verification.",
            "status", "PENDING"
        );
    }

    @Transactional
    public Map<String, Object> registerDelivery(StaffRegistration input) {
        return createUser(input.fullName(), input.email(), input.password(), input.phone(), input.city(), null, null, "DELIVERY");
    }

    @Transactional
    public Map<String, Object> registerDriver(StaffRegistration input) {
        return createUser(input.fullName(), input.email(), input.password(), input.phone(), input.city(), null, null, "DRIVER");
    }

    public Map<String, Object> login(LoginRequest input) {
        Map<String, Object> user = findUserByEmail(input.email());
        if (user == null || !encoder.matches(input.password(), (String) user.get("password_hash"))) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Incorrect email or password.");
        }
        if ("OWNER".equals(user.get("role"))) {
            var apps = jdbc.queryForList("SELECT status, review_note FROM rental_owner_applications WHERE user_id = ? ORDER BY created_at DESC", user.get("id"));
            if (apps.isEmpty()) {
                throw new ApiException(HttpStatus.FORBIDDEN, "No rental owner profile found.");
            }
            String status = (String) apps.get(0).get("status");
            if ("PENDING".equalsIgnoreCase(status)) {
                throw new ApiException(HttpStatus.FORBIDDEN, "Your rental shop registration is currently PENDING admin approval. You can log in once verified.");
            }
            if ("REJECTED".equalsIgnoreCase(status)) {
                String note = (String) apps.get(0).get("review_note");
                throw new ApiException(HttpStatus.FORBIDDEN, "Your rental shop registration was rejected. " + (note != null ? note : ""));
            }
        }
        return tokenResponse(user);
    }

    public Map<String, Object> me(String userId) {
        Map<String, Object> user = findUserById(userId);
        if (user == null) throw new ApiException(HttpStatus.NOT_FOUND, "User not found.");
        Map<String, Object> map = new HashMap<>();
        map.put("id", user.get("id"));
        map.put("email", user.get("email"));
        map.put("role", user.get("role"));
        map.put("fullName", user.get("full_name"));
        map.put("phone", user.get("phone"));
        map.put("city", user.get("city"));
        map.put("profileImage", user.get("profile_image") != null ? user.get("profile_image").toString() : "");
        return map;
    }

    @Transactional
    public Map<String, Object> updateProfile(String userId, AuthDtos.UpdateProfileRequest input) {
        Map<String, Object> existing = findUserById(userId);
        if (existing == null) throw new ApiException(HttpStatus.NOT_FOUND, "User not found.");

        String image = (input.profileImage() != null && !input.profileImage().isBlank())
                ? input.profileImage().trim()
                : (existing.get("profile_image") != null ? existing.get("profile_image").toString() : null);

        jdbc.update("UPDATE users SET full_name = ?, phone = ?, city = ?, profile_image = ? WHERE id = ?",
                input.fullName().trim(), input.phone().trim(), input.city().trim(), image, userId);

        return me(userId);
    }

    @Transactional
    public Map<String, Object> changePassword(String userId, AuthDtos.ChangePasswordRequest input) {
        Map<String, Object> user = findUserById(userId);
        if (user == null) throw new ApiException(HttpStatus.NOT_FOUND, "User not found.");

        if (!encoder.matches(input.currentPassword(), (String) user.get("password_hash"))) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Current password does not match.");
        }

        jdbc.update("UPDATE users SET password_hash = ? WHERE id = ?",
                encoder.encode(input.newPassword().trim()), userId);

        return Map.of("message", "Password updated successfully.");
    }

    private Map<String, Object> createUser(String fullName, String email, String password, String phone, String city, Double latitude, Double longitude, String role) {
        String id = UUID.randomUUID().toString();
        try {
            jdbc.update("INSERT INTO users (id,email,password_hash,role,full_name,phone,city,latitude,longitude) VALUES (?,?,?,?,?,?,?,?,?)",
                    id, normalizedEmail(email), encoder.encode(password), role, fullName.trim(), phone.trim(), city.trim(), latitude, longitude);
        } catch (DuplicateKeyException exception) {
            throw new ApiException(HttpStatus.CONFLICT, "An account already exists with this email.");
        }
        return tokenResponse(findUserById(id));
    }

    public Map<String, Object> tokenResponse(Map<String, Object> user) {
        UserSession session = new UserSession((String) user.get("id"), (String) user.get("email"), (String) user.get("role"), (String) user.get("full_name"));
        Map<String, Object> userMap = new HashMap<>();
        userMap.put("id", session.id());
        userMap.put("email", session.email());
        userMap.put("role", session.role());
        userMap.put("fullName", session.fullName());
        userMap.put("phone", user.get("phone") != null ? user.get("phone").toString() : "");
        userMap.put("city", user.get("city") != null ? user.get("city").toString() : "");
        userMap.put("profileImage", user.get("profile_image") != null ? user.get("profile_image").toString() : "");

        Map<String, Object> res = new HashMap<>();
        res.put("token", jwt.create(session));
        res.put("user", userMap);
        return res;
    }

    private Map<String, Object> findUserByEmail(String email) {
        var rows = jdbc.queryForList("SELECT * FROM users WHERE email = ?", normalizedEmail(email));
        return rows.isEmpty() ? null : rows.getFirst();
    }

    private Map<String, Object> findUserById(String id) {
        var rows = jdbc.queryForList("SELECT * FROM users WHERE id = ?", id);
        return rows.isEmpty() ? null : rows.getFirst();
    }

    private String normalizedEmail(String email) { return email.trim().toLowerCase(Locale.ROOT); }
    private String blankToNull(String value) { return value == null || value.isBlank() ? null : value.trim(); }
}
