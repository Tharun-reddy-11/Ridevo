package com.ridenexa.payment;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public final class PaymentDtos {
    private PaymentDtos() {}

    public record CreateOrderRequest(
        @NotBlank String bookingId,
        @NotNull BigDecimal amount
    ) {}

    public record VerifyPaymentRequest(
        @NotBlank String bookingId,
        String invoiceId,
        String orderId,
        String paymentId,
        String signature,
        String paymentMethod
    ) {}

    public record PayInvoiceRequest(
        @NotNull BigDecimal amount,
        String paymentMethod
    ) {}
}
