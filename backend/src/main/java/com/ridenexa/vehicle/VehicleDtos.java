package com.ridenexa.vehicle;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public final class VehicleDtos {
    private VehicleDtos() {}
    public record CreateVehicle(@NotBlank String vehicleType, @NotBlank String make, @NotBlank String model, @NotBlank String registrationNumber, @NotBlank String transmission, @NotBlank String fuelType, @Min(1) int seats, @DecimalMin("1") BigDecimal dailyRate, @DecimalMin("1") BigDecimal hourlyRate, @DecimalMin("0") BigDecimal securityDeposit, @NotBlank String city, Double latitude, Double longitude, String imageUrl, String description, boolean deliverySupported, boolean driverSupported) {}
    public record AvailabilityUpdate(@NotBlank @Pattern(regexp = "AVAILABLE|UNAVAILABLE|MAINTENANCE") String status) {}
}
