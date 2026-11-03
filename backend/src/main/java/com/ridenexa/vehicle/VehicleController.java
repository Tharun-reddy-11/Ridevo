package com.ridenexa.vehicle;

import jakarta.validation.Valid;
import java.time.LocalDateTime;
import java.util.*;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1")
public class VehicleController {
    private final VehicleService vehicles;
    public VehicleController(VehicleService vehicles) { this.vehicles = vehicles; }
    @GetMapping({"/vehicles", "/public/vehicles"}) public List<Map<String, Object>> discover(@RequestParam(required = false) String city, @RequestParam(required = false) String type, @RequestParam(required = false) LocalDateTime start, @RequestParam(required = false) LocalDateTime end, @RequestParam(required = false) Double latitude, @RequestParam(required = false) Double longitude) { return vehicles.discover(city,type,start,end,latitude,longitude); }
    @GetMapping({"/vehicles/{id}", "/public/vehicles/{id}"}) public Map<String, Object> get(@PathVariable String id) { return vehicles.vehicle(id); }
    @GetMapping({"/vehicles/mine", "/owner/vehicles"}) public List<Map<String, Object>> mine() { return vehicles.mine(); }
    @PostMapping({"/vehicles", "/owner/vehicles"}) @ResponseStatus(HttpStatus.CREATED) public Map<String,Object> create(@Valid @RequestBody VehicleDtos.CreateVehicle vehicle) { return vehicles.create(vehicle); }
    @PatchMapping({"/vehicles/{id}/availability", "/owner/vehicles/{id}/availability"}) public Map<String,Object> setAvailability(@PathVariable String id, @Valid @RequestBody VehicleDtos.AvailabilityUpdate input) { return vehicles.setAvailability(id, input); }
    @PostMapping({"/vehicles/upload-image", "/owner/uploads/vehicle-image"}) public Map<String,String> upload(@RequestParam("file") MultipartFile file) { return vehicles.upload(file); }
}
