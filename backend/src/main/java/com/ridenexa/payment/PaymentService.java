package com.ridenexa.payment;

import com.ridenexa.core.ApiException;
import com.ridenexa.security.CurrentUser;
import com.ridenexa.security.UserSession;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.*;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PaymentService {
    private final JdbcTemplate jdbc;
    private final CurrentUser current;
    private final String razorpayKeyId;
    private final String razorpayKeySecret;

    public PaymentService(
        JdbcTemplate jdbc,
        CurrentUser current,
        @Value("${RAZORPAY_KEY_ID:}") String razorpayKeyId,
        @Value("${RAZORPAY_KEY_SECRET:}") String razorpayKeySecret
    ) {
        this.jdbc = jdbc;
        this.current = current;
        this.razorpayKeyId = razorpayKeyId;
        this.razorpayKeySecret = razorpayKeySecret;
    }

    public Map<String, Object> createOrder(PaymentDtos.CreateOrderRequest input) {
        UserSession user = current.require();
        String orderId = "order_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        return Map.of(
            "orderId", orderId,
            "keyId", razorpayKeyId != null && !razorpayKeyId.isBlank() ? razorpayKeyId : "rzp_test_ridenexa",
            "amount", input.amount(),
            "currency", "INR",
            "customerName", user.fullName(),
            "customerEmail", user.email(),
            "isLiveGateway", razorpayKeyId != null && !razorpayKeyId.isBlank()
        );
    }

    @Transactional
    public Map<String, Object> verify(PaymentDtos.VerifyPaymentRequest input) {
        UserSession user = current.require();
        String paymentId = input.paymentId() != null && !input.paymentId().isBlank() ? input.paymentId() : "pay_" + UUID.randomUUID().toString().replace("-", "").substring(0, 14);
        String paymentMethod = input.paymentMethod() != null ? input.paymentMethod().toUpperCase() : "RAZORPAY";

        // Signature check if gateway secret is active and real IDs are supplied
        if (razorpayKeySecret != null && !razorpayKeySecret.isBlank() && input.orderId() != null && input.signature() != null) {
            String payload = input.orderId() + "|" + paymentId;
            boolean valid = verifyHmacSha256(payload, input.signature(), razorpayKeySecret);
            if (!valid) throw new ApiException(HttpStatus.BAD_REQUEST, "Payment gateway signature verification failed.");
        }

        // Fetch invoice
        List<Map<String, Object>> invoices = jdbc.queryForList("SELECT * FROM invoices WHERE booking_id = ? ORDER BY created_at DESC", input.bookingId());
        String invoiceId = input.invoiceId();
        BigDecimal amountPaid = BigDecimal.ZERO;

        if (!invoices.isEmpty()) {
            Map<String, Object> inv = invoices.getFirst();
            invoiceId = (String) inv.get("id");
            BigDecimal total = (BigDecimal) inv.get("total_amount");
            amountPaid = total != null ? total : BigDecimal.ZERO;
            jdbc.update("UPDATE invoices SET amount_paid = total_amount, balance_due = 0, status = 'PAID', paid_at = NOW() WHERE id = ?", invoiceId);
        } else {
            // Find quoted total from booking
            BigDecimal quoted = jdbc.queryForObject("SELECT quoted_total FROM bookings WHERE id = ?", BigDecimal.class, input.bookingId());
            amountPaid = quoted != null ? quoted : BigDecimal.ZERO;
            invoiceId = UUID.randomUUID().toString();
            jdbc.update(
                "INSERT INTO invoices (id, booking_id, customer_id, base_amount, total_amount, amount_paid, balance_due, status, paid_at) VALUES (?, ?, ?, ?, ?, ?, 0, 'PAID', NOW())",
                invoiceId, input.bookingId(), user.id(), amountPaid, amountPaid, amountPaid
            );
        }

        // Record payment transaction
        String payRecordId = UUID.randomUUID().toString();
        jdbc.update(
            "INSERT INTO payments (id, invoice_id, booking_id, customer_id, amount, payment_method, gateway_order_id, gateway_payment_id, gateway_signature, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'SUCCESS')",
            payRecordId, invoiceId, input.bookingId(), user.id(), amountPaid, paymentMethod, input.orderId(), paymentId, input.signature()
        );

        // System message in chat
        jdbc.update(
            "INSERT INTO booking_messages (id, booking_id, sender_id, sender_role, message) VALUES (?, ?, NULL, 'SYSTEM', ?)",
            UUID.randomUUID().toString(), input.bookingId(), "Payment of ₹" + amountPaid + " received successfully via " + paymentMethod + " (" + paymentId + ")."
        );

        return Map.of(
            "status", "SUCCESS",
            "paymentId", paymentId,
            "amountPaid", amountPaid,
            "invoiceId", invoiceId,
            "message", "Payment verified and recorded successfully."
        );
    }

    public Map<String, Object> invoiceForBooking(String bookingId) {
        current.require();
        List<Map<String, Object>> list = jdbc.queryForList(
            "SELECT i.*, b.start_at, b.end_at, b.quoted_total, v.make, v.model, v.registration_number, u.full_name AS customer_name " +
            "FROM invoices i " +
            "JOIN bookings b ON b.id = i.booking_id " +
            "JOIN vehicles v ON v.id = b.vehicle_id " +
            "JOIN users u ON u.id = i.customer_id " +
            "WHERE i.booking_id = ? ORDER BY i.created_at DESC", bookingId
        );
        if (list.isEmpty()) {
            // If no invoice yet, generate draft from booking
            Map<String, Object> booking = jdbc.queryForMap(
                "SELECT b.*, v.make, v.model, v.registration_number, u.full_name AS customer_name " +
                "FROM bookings b JOIN vehicles v ON v.id = b.vehicle_id JOIN users u ON u.id = b.customer_id WHERE b.id = ?", bookingId
            );
            return Map.of(
                "booking_id", bookingId,
                "base_amount", booking.get("quoted_total"),
                "tax_amount", BigDecimal.ZERO,
                "delivery_fee", BigDecimal.ZERO,
                "late_fee", BigDecimal.ZERO,
                "total_amount", booking.get("quoted_total"),
                "amount_paid", BigDecimal.ZERO,
                "balance_due", booking.get("quoted_total"),
                "status", "DRAFT"
            );
        }
        return list.getFirst();
    }

    @Transactional
    public Map<String, Object> payInvoice(String invoiceId, PaymentDtos.PayInvoiceRequest input) {
        UserSession user = current.require();
        Map<String, Object> inv = jdbc.queryForMap("SELECT * FROM invoices WHERE id = ?", invoiceId);
        BigDecimal due = (BigDecimal) inv.get("balance_due");

        BigDecimal payAmount = input.amount() != null ? input.amount() : due;
        BigDecimal newBalance = due.subtract(payAmount).max(BigDecimal.ZERO);
        String newStatus = newBalance.compareTo(BigDecimal.ZERO) == 0 ? "PAID" : "PARTIAL";

        jdbc.update(
            "UPDATE invoices SET amount_paid = amount_paid + ?, balance_due = ?, status = ?, paid_at = NOW() WHERE id = ?",
            payAmount, newBalance, newStatus, invoiceId
        );

        String paymentId = "pay_settle_" + UUID.randomUUID().toString().substring(0, 8);
        jdbc.update(
            "INSERT INTO payments (id, invoice_id, booking_id, customer_id, amount, payment_method, gateway_payment_id, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'SUCCESS')",
            UUID.randomUUID().toString(), invoiceId, inv.get("booking_id"), user.id(), payAmount, input.paymentMethod() != null ? input.paymentMethod() : "UPI", paymentId
        );

        return Map.of(
            "status", "SUCCESS",
            "invoiceId", invoiceId,
            "amountPaid", payAmount,
            "balanceRemaining", newBalance
        );
    }

    private boolean verifyHmacSha256(String data, String signature, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString().equalsIgnoreCase(signature);
        } catch (Exception e) {
            return false;
        }
    }
}
