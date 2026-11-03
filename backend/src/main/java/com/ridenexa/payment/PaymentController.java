package com.ridenexa.payment;

import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1")
public class PaymentController {
    private final PaymentService payment;

    public PaymentController(PaymentService payment) {
        this.payment = payment;
    }

    @PostMapping("/payments/create-order")
    public Map<String, Object> createOrder(@Valid @RequestBody PaymentDtos.CreateOrderRequest input) {
        return payment.createOrder(input);
    }

    @PostMapping("/payments/verify")
    public Map<String, Object> verifyPayment(@Valid @RequestBody PaymentDtos.VerifyPaymentRequest input) {
        return payment.verify(input);
    }

    @GetMapping("/invoices/booking/{bookingId}")
    public Map<String, Object> getInvoiceForBooking(@PathVariable String bookingId) {
        return payment.invoiceForBooking(bookingId);
    }

    @PostMapping("/invoices/{id}/pay")
    public Map<String, Object> payInvoice(@PathVariable String id, @Valid @RequestBody PaymentDtos.PayInvoiceRequest input) {
        return payment.payInvoice(id, input);
    }
}
