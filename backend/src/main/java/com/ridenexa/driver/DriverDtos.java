package com.ridenexa.driver;

import jakarta.validation.constraints.NotBlank;

public final class DriverDtos {
    private DriverDtos() {}

    public record UpdateTripRequest(
        @NotBlank String status,
        Integer endOdometer,
        String notes
    ) {}
}
