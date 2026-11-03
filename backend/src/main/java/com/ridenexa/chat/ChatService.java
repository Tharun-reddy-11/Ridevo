package com.ridenexa.chat;

import com.ridenexa.vehicle.VehicleService;
import java.math.BigDecimal;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class ChatService {
    private final JdbcTemplate jdbc;
    private final VehicleService vehicleService;

    public ChatService(JdbcTemplate jdbc, VehicleService vehicleService) {
        this.jdbc = jdbc;
        this.vehicleService = vehicleService;
    }

    public Map<String, Object> reply(ChatDtos.ChatRequest input) {
        String msg = input.message().toLowerCase(Locale.ROOT).trim();

        // 1. Policy & Workflow Answers
        if (msg.contains("doorstep") || msg.contains("deliver")) {
            return Map.of(
                "reply", "RideNexa provides end-to-end doorstep vehicle delivery! When you book, select 'Doorstep Delivery' and enter your address. A verified rental partner worker will drive the vehicle to your location, physically verify your driving licence, collect payment, verify your secure 6-digit OTP, and hand over the keys.",
                "type", "POLICY_INFO",
                "suggestedAction", "/vehicles"
            );
        }

        if (msg.contains("late") || msg.contains("grace") || msg.contains("penalty")) {
            return Map.of(
                "reply", "Our transparent late-fee policy includes a mandatory 15-minute grace period. If you return within 15 minutes of your scheduled end time, no fee is charged. After 15 minutes, late fees are billed per hour at the vehicle's standard hourly rate. Importantly, if you scheduled doorstep collection and made the vehicle available on time, you are never charged for delays caused by our collection staff!",
                "type", "POLICY_INFO"
            );
        }

        if (msg.contains("licence") || msg.contains("license") || msg.contains("document")) {
            return Map.of(
                "reply", "You do not need to upload your driving licence during online booking! At vehicle handover, our staff member will physically inspect your original driving licence to confirm validity and vehicle class before releasing the vehicle.",
                "type", "POLICY_INFO"
            );
        }

        if (msg.contains("driver") || msg.contains("chauffeur")) {
            return Map.of(
                "reply", "RideNexa offers both Self-Drive and Professional Chauffeur options. When exploring vehicles, look for the 'Driver available' badge or filter by chauffeur service. Our professional drivers are verified and stay with you for the duration of your trip.",
                "type", "POLICY_INFO"
            );
        }

        // 2. Real Vehicle Search in MySQL
        String city = input.city();
        if (city == null || city.isBlank()) {
            if (msg.contains("tirupati")) city = "Tirupati";
            else if (msg.contains("bangalore") || msg.contains("bengaluru")) city = "Bangalore";
            else if (msg.contains("chennai")) city = "Chennai";
            else if (msg.contains("hyderabad")) city = "Hyderabad";
        }

        String type = input.vehicleType();
        if (type == null || type.isBlank()) {
            if (msg.contains("car") || msg.contains("sedan") || msg.contains("hatchback")) type = "CAR";
            else if (msg.contains("suv")) type = "SUV";
            else if (msg.contains("bike") || msg.contains("motorcycle")) type = "BIKE";
            else if (msg.contains("scooter") || msg.contains("activa")) type = "SCOOTER";
            else if (msg.contains("van")) type = "VAN";
        }

        List<Map<String, Object>> vehicles = vehicleService.discover(city, type, null, null, null, null);

        if (!vehicles.isEmpty()) {
            Map<String, Object> top = vehicles.getFirst();
            String cityText = city != null ? " in " + city : "";
            String typeText = type != null ? " " + type : " vehicle";
            return Map.of(
                "reply", "I found " + vehicles.size() + " verified" + typeText + " options available" + cityText + "! Top match: " + top.get("make") + " " + top.get("model") + " at ₹" + top.get("daily_rate") + "/day with doorstep delivery.",
                "type", "VEHICLE_SEARCH",
                "vehicles", vehicles.stream().limit(3).toList(),
                "suggestedAction", "/vehicles" + (city != null ? "?city=" + city : "")
            );
        }

        return Map.of(
            "reply", "I can help you find rental vehicles, explain doorstep delivery, check pricing quotes, or guide you through return options. Tell me your city or preferred vehicle type (Car, SUV, Bike, Scooter) to see live listings!",
            "type", "GENERAL_ASSISTANCE",
            "suggestedAction", "/vehicles"
        );
    }
}
