package com.ridenexa.booking;

import jakarta.validation.constraints.*;
import java.time.LocalDateTime;

public final class BookingDtos {
    private BookingDtos() {}

    public record BookingRequest(
        @NotBlank String vehicleId,
        @NotNull LocalDateTime startAt,
        @NotNull LocalDateTime endAt,
        @NotBlank String deliveryMethod,
        @NotBlank String returnMethod,
        @NotBlank String rentalMode,
        @NotBlank @Size(max = 500) String pickupAddress,
        @NotBlank @Size(max = 500) String destinationAddress,
        @NotNull Boolean driverRequired
    ) {}

    public record BookingDecision(
        @Pattern(regexp = "APPROVED|REJECTED") String status,
        @Size(max = 500) String note
    ) {}

    public record OwnerDecision(
        @Pattern(regexp = "APPROVED|REJECTED") String status,
        @Size(max = 500) String note
    ) {}

    public record MessageRequest(
        @NotBlank @Size(max = 1000) String message
    ) {}

    public record ReturnChoiceRequest(
        @NotBlank String returnMethod,
        String returnAddress,
        LocalDateTime requestedSlot
    ) {}

    public record QuoteRequest(
        @NotBlank String vehicleId,
        @NotNull LocalDateTime startAt,
        @NotNull LocalDateTime endAt,
        String deliveryMethod,
        Boolean driverRequired
    ) {}
}
