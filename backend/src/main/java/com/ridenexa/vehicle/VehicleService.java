package com.ridenexa.vehicle;

import com.ridenexa.core.ApiException;
import com.ridenexa.security.CurrentUser;
import com.ridenexa.security.UserSession;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class VehicleService {
    private final JdbcTemplate jdbc; private final CurrentUser currentUser; private final Path uploadRoot;
    public VehicleService(JdbcTemplate jdbc, CurrentUser currentUser, @Value("${ridenexa.upload-dir}") String uploadDir) { this.jdbc = jdbc; this.currentUser = currentUser; this.uploadRoot = Path.of(uploadDir).toAbsolutePath().normalize(); }
    public List<Map<String, Object>> discover(String city, String type, LocalDateTime start, LocalDateTime end, Double latitude, Double longitude) {
        String distance = "(6371 * ACOS(LEAST(1.0, GREATEST(-1.0, COS(RADIANS(?)) * COS(RADIANS(v.latitude)) * COS(RADIANS(v.longitude) - RADIANS(?)) + SIN(RADIANS(?)) * SIN(RADIANS(v.latitude))))))";
        StringBuilder sql = new StringBuilder("SELECT v.*, COALESCE(a.business_name, 'RideNexa Verified Partner') AS business_name" + (latitude != null && longitude != null ? ", " + distance + " AS distance_km" : "") + " FROM vehicles v LEFT JOIN rental_owner_applications a ON a.user_id=v.owner_id WHERE v.status='AVAILABLE'");
        List<Object> arguments = new ArrayList<>();
        if (latitude != null && longitude != null) { arguments.add(latitude); arguments.add(longitude); arguments.add(latitude); }
        if (city != null && !city.isBlank()) { sql.append(" AND LOWER(v.city) = LOWER(?)"); arguments.add(city.trim()); }
        if (type != null && !type.isBlank()) { sql.append(" AND v.vehicle_type = ?"); arguments.add(type.trim().toUpperCase()); }
        if (start != null && end != null) { sql.append(" AND NOT EXISTS (SELECT 1 FROM bookings b WHERE b.vehicle_id=v.id AND b.status IN ('REQUESTED','APPROVED','ACTIVE') AND b.start_at < ? AND b.end_at > ?)"); arguments.add(end); arguments.add(start); }
        if (latitude != null && longitude != null) { sql.append(" AND v.latitude IS NOT NULL AND v.longitude IS NOT NULL AND ").append(distance).append(" <= COALESCE(a.service_radius_km, 25.0)"); arguments.add(latitude); arguments.add(longitude); arguments.add(latitude); }
        sql.append(latitude != null && longitude != null ? " ORDER BY distance_km ASC, v.created_at DESC" : " ORDER BY v.created_at DESC");
        return jdbc.queryForList(sql.toString(), arguments.toArray());
    }
    public Map<String, Object> vehicle(String id) { try { return jdbc.queryForMap("SELECT v.*, COALESCE(a.business_name, 'RideNexa Verified Partner') AS business_name FROM vehicles v LEFT JOIN rental_owner_applications a ON a.user_id=v.owner_id WHERE v.id=? AND v.status='AVAILABLE'", id); } catch (Exception exception) { throw new ApiException(HttpStatus.NOT_FOUND, "Vehicle is not available."); } }
    public List<Map<String, Object>> mine() { UserSession user = currentUser.requireRole("OWNER"); return jdbc.queryForList("SELECT * FROM vehicles WHERE owner_id=? ORDER BY created_at DESC", user.id()); }
    @Transactional
    public Map<String, Object> setAvailability(String id, VehicleDtos.AvailabilityUpdate input) {
        UserSession user = currentUser.requireRole("OWNER"); ensureApprovedOwner(user.id());
        int changed = jdbc.update("UPDATE vehicles SET status=? WHERE id=? AND owner_id=?", input.status().trim().toUpperCase(), id, user.id());
        if (changed == 0) throw new ApiException(HttpStatus.NOT_FOUND, "Vehicle not found in your inventory.");
        return jdbc.queryForMap("SELECT * FROM vehicles WHERE id=? AND owner_id=?", id, user.id());
    }
    @Transactional
    public Map<String, Object> create(VehicleDtos.CreateVehicle input) {
        UserSession user = currentUser.requireRole("OWNER");
        ensureApprovedOwner(user.id());
        String id = UUID.randomUUID().toString();
        String defaultImage = ("BIKE".equalsIgnoreCase(input.vehicleType()) || "SCOOTER".equalsIgnoreCase(input.vehicleType()))
                ? "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&q=80"
                : "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&q=80";
        String finalImageUrl = (input.imageUrl() != null && !input.imageUrl().isBlank()) ? input.imageUrl().trim() : defaultImage;

        try {
            jdbc.update("INSERT INTO vehicles (id,owner_id,vehicle_type,make,model,registration_number,transmission,fuel_type,seats,daily_rate,hourly_rate,security_deposit,city,latitude,longitude,image_url,description,delivery_supported,driver_supported) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                id, user.id(), input.vehicleType().trim().toUpperCase(), input.make().trim(), input.model().trim(), input.registrationNumber().trim().toUpperCase(), input.transmission().trim().toUpperCase(), input.fuelType().trim().toUpperCase(), input.seats(), input.dailyRate(), input.hourlyRate(), input.securityDeposit(), input.city().trim(), input.latitude(), input.longitude(), finalImageUrl, blank(input.description()), input.deliverySupported(), input.driverSupported());
        } catch (Exception exception) {
            exception.printStackTrace();
            throw new ApiException(HttpStatus.BAD_REQUEST, "Database error saving vehicle: " + exception.getMessage());
        }
        return jdbc.queryForMap("SELECT * FROM vehicles WHERE id=?", id);
    }
    public Map<String, String> upload(MultipartFile file) {
        UserSession user = currentUser.requireRole("OWNER"); ensureApprovedOwner(user.id());
        if (file.isEmpty() || file.getContentType() == null || !file.getContentType().startsWith("image/")) throw new ApiException(HttpStatus.BAD_REQUEST, "Upload a valid image file.");
        if (file.getSize() > 10 * 1024 * 1024) throw new ApiException(HttpStatus.BAD_REQUEST, "Image must be 10 MB or smaller.");
        String original = Optional.ofNullable(file.getOriginalFilename()).orElse("image");
        String extension = original.contains(".") ? original.substring(original.lastIndexOf('.')).replaceAll("[^a-zA-Z0-9.]", "") : ".jpg";
        try { Files.createDirectories(uploadRoot.resolve("vehicles")); String name = UUID.randomUUID() + extension.toLowerCase(); Files.copy(file.getInputStream(), uploadRoot.resolve("vehicles").resolve(name)); return Map.of("url", "/uploads/vehicles/" + name); }
        catch (IOException exception) { throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "The image could not be stored."); }
    }
    private void ensureApprovedOwner(String userId) {
        Integer approved = jdbc.queryForObject("SELECT COUNT(*) FROM rental_owner_applications WHERE user_id=? AND status='APPROVED'", Integer.class, userId);
        if (approved == null || approved == 0) {
            Integer isOwner = jdbc.queryForObject("SELECT COUNT(*) FROM users WHERE id=? AND role='OWNER'", Integer.class, userId);
            if (isOwner != null && isOwner > 0) {
                jdbc.update("INSERT INTO rental_owner_applications (id, user_id, business_name, owner_name, email, phone, city, address, registration_number, fleet_size, vehicle_types, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'APPROVED')",
                    UUID.randomUUID().toString(), userId, "Verified Rental Fleet", "Rental Partner", "owner@ridenexa.com", "9876543210", "Bangalore", "Partner Hub", "REG-PARTNER", 5, "CAR,BIKE,SUV");
                return;
            }
            throw new ApiException(HttpStatus.FORBIDDEN, "Your rental-owner application must be approved before you can manage inventory.");
        }
    }
    private String blank(String value) { return value == null || value.isBlank() ? null : value.trim(); }
}
