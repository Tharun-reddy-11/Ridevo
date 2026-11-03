package com.ridenexa.recommendation;

import com.ridenexa.security.CurrentUser;
import com.ridenexa.vehicle.VehicleService;
import java.math.BigDecimal;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Service
public class RecommendationService {
    private final VehicleService vehicles;
    private final CurrentUser currentUser;
    private final RestClient ml;
    public RecommendationService(VehicleService vehicles, CurrentUser currentUser, @Value("${ridenexa.ml-service-url}") String serviceUrl) {
        this.vehicles = vehicles;
        this.currentUser = currentUser;
        this.ml = RestClient.builder().baseUrl(serviceUrl).build();
    }
    public Map<String, Object> recommend() {
        currentUser.requireRole("CUSTOMER");
        List<Map<String, Object>> candidates = vehicles.discover(null, null, null, null, null, null);
        if (candidates.isEmpty()) return Map.of("source", "NO_CANDIDATES", "vehicles", List.of(), "message", "No live vehicle inventory is available yet.");
        try {
            List<Map<String, Object>> mlCandidates = candidates.stream().map(this::toMlCandidate).toList();
            Map<?, ?> response = ml.post().uri("/recommendations/rank").contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("candidates", mlCandidates)).retrieve().body(Map.class);
            Map<String, Double> scores = new HashMap<>();
            Object responseRankings = response == null ? null : response.get("recommendations");
            List<?> rankings = responseRankings instanceof List<?> list ? list : List.of();
            for (Object item : rankings) { if (item instanceof Map<?, ?> ranking) scores.put(String.valueOf(ranking.get("vehicle_id")), ((Number) ranking.get("score")).doubleValue()); }
            candidates.sort(Comparator.comparing((Map<String,Object> vehicle) -> scores.getOrDefault(vehicle.get("id").toString(), 0D)).reversed());
            return Map.of("source", "ML_MODEL", "vehicles", candidates, "message", "Ranked by the current RideNexa recommendation model.");
        } catch (RestClientException | ClassCastException exception) {
            candidates.sort(Comparator.comparing((Map<String,Object> vehicle) -> decimal(vehicle.get("rating"))).reversed().thenComparing(vehicle -> decimal(vehicle.get("daily_rate"))));
            return Map.of("source", "DETERMINISTIC_FALLBACK", "vehicles", candidates, "message", "Suggestions use rating and price while the ML model is unavailable or has not yet been trained on sufficient real interaction data.");
        }
    }
    private Map<String, Object> toMlCandidate(Map<String, Object> vehicle) {
        return Map.of("vehicle_id", vehicle.get("id"), "category", vehicle.get("vehicle_type"), "daily_rate", decimal(vehicle.get("daily_rate")).doubleValue(), "city", vehicle.get("city"), "delivery_supported", vehicle.get("delivery_supported"), "driver_supported", vehicle.get("driver_supported"), "rating", decimal(vehicle.get("rating")).doubleValue(), "review_count", ((Number) vehicle.get("review_count")).intValue());
    }
    private BigDecimal decimal(Object value) { return value instanceof BigDecimal decimal ? decimal : new BigDecimal(String.valueOf(value == null ? 0 : value)); }
}
