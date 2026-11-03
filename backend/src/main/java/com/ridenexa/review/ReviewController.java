package com.ridenexa.review;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class ReviewController {
    private final ReviewService reviews;

    public ReviewController(ReviewService reviews) {
        this.reviews = reviews;
    }

    @PostMapping("/reviews")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> create(@Valid @RequestBody ReviewDtos.CreateReviewRequest input) {
        return reviews.create(input);
    }

    @GetMapping("/public/vehicles/{id}/reviews")
    public List<Map<String, Object>> getVehicleReviews(@PathVariable String id) {
        return reviews.vehicleReviews(id);
    }
}
