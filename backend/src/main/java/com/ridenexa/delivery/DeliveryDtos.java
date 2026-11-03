package com.ridenexa.delivery;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public final class DeliveryDtos {
    private DeliveryDtos() {}

    public record UpdateStatusRequest(@NotBlank String status) {}
    public record VerifyLicenceRequest(@NotBlank String licenceNumber) {}
    public record HandoverRequest(
        @NotBlank String otp,
        @NotNull Integer odometerReading,
        @NotNull Integer fuelPercent,
        String inspectionNotes
    ) {}
    public record ReturnInspectionRequest(
        @NotNull Integer odometerReading,
        @NotNull Integer fuelPercent,
        String inspectionNotes,
        Boolean customerDelay
    ) {}
    public record AssignStaffRequest(String staffId) {}
}
