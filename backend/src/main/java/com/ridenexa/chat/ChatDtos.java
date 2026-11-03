package com.ridenexa.chat;

import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;

public final class ChatDtos {
    private ChatDtos() {}

    public record ChatRequest(
        @NotBlank String message,
        String city,
        String vehicleType,
        BigDecimal maxDailyRate
    ) {}
}
