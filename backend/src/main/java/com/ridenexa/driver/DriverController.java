package com.ridenexa.driver;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/driver/trips")
public class DriverController {
    private final DriverService drivers;

    public DriverController(DriverService drivers) {
        this.drivers = drivers;
    }

    @GetMapping("/my")
    public List<Map<String, Object>> myTrips() {
        return drivers.myTrips();
    }

    @GetMapping("/{id}")
    public Map<String, Object> trip(@PathVariable String id) {
        return drivers.trip(id);
    }

    @PatchMapping("/{id}")
    public Map<String, Object> updateTrip(@PathVariable String id, @Valid @RequestBody DriverDtos.UpdateTripRequest input) {
        return drivers.updateTrip(id, input);
    }
}
