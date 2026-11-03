package com.ridenexa.recommendation;

import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/customer/recommendations")
public class RecommendationController {
    private final RecommendationService recommendations;
    public RecommendationController(RecommendationService recommendations) { this.recommendations = recommendations; }
    @GetMapping
    public Map<String, Object> list() { return recommendations.recommend(); }
}
