package com.ridenexa.booking;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class BookingController {
    private final BookingService bookings;

    public BookingController(BookingService bookings) {
        this.bookings = bookings;
    }

    @PostMapping("/public/bookings/quote")
    public Map<String, Object> calculatePublicQuote(@Valid @RequestBody BookingDtos.QuoteRequest input) {
        return bookings.calculateQuote(input);
    }

    @PostMapping("/bookings/quote")
    public Map<String, Object> calculateQuote(@Valid @RequestBody BookingDtos.QuoteRequest input) {
        return bookings.calculateQuote(input);
    }

    @PostMapping({"/customer/bookings", "/bookings"})
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> request(@Valid @RequestBody BookingDtos.BookingRequest input) {
        return bookings.request(input);
    }

    @GetMapping({"/customer/bookings", "/bookings/my-bookings"})
    public List<Map<String, Object>> customerBookings() {
        return bookings.customerBookings();
    }

    @GetMapping({"/owner/bookings", "/bookings/owner-dashboard"})
    public List<Map<String, Object>> ownerBookings() {
        return bookings.ownerBookings();
    }

    @GetMapping("/bookings/{id}")
    public Map<String, Object> getBooking(@PathVariable String id) {
        return bookings.bookingById(id);
    }

    @PatchMapping({"/owner/bookings/{id}", "/bookings/{id}/decision"})
    public Map<String, Object> decide(@PathVariable String id, @Valid @RequestBody BookingDtos.BookingDecision input) {
        return bookings.decide(id, input);
    }

    @GetMapping("/bookings/{id}/return-options")
    public Map<String, Object> returnOptions(@PathVariable String id) {
        return bookings.returnOptions(id);
    }

    @PostMapping("/bookings/{id}/return-choice")
    public Map<String, Object> returnChoice(@PathVariable String id, @Valid @RequestBody BookingDtos.ReturnChoiceRequest input) {
        return bookings.returnChoice(id, input);
    }

    @GetMapping("/bookings/{id}/late-fee-preview")
    public Map<String, Object> lateFeePreview(@PathVariable String id) {
        return bookings.lateFeePreview(id);
    }

    @GetMapping("/bookings/{id}/messages")
    public List<Map<String, Object>> messages(@PathVariable String id) {
        return bookings.messages(id);
    }

    @PostMapping("/bookings/{id}/messages")
    @ResponseStatus(HttpStatus.CREATED)
    public Map<String, Object> sendMessage(@PathVariable String id, @Valid @RequestBody BookingDtos.MessageRequest input) {
        return bookings.sendMessage(id, input);
    }

    @GetMapping("/dashboard")
    public Map<String, Object> dashboard() {
        return bookings.dashboard();
    }
}
