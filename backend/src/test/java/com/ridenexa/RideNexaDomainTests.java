package com.ridenexa;

import com.ridenexa.booking.BookingDtos;
import com.ridenexa.chat.ChatDtos;
import com.ridenexa.delivery.DeliveryDtos;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

class RideNexaDomainTests {

    @Test
    void quoteRequestRecordInstantiatesCorrectly() {
        LocalDateTime start = LocalDateTime.now().plusDays(1);
        LocalDateTime end = start.plusHours(6);
        BookingDtos.QuoteRequest req = new BookingDtos.QuoteRequest("v-1", start, end, "DOORSTEP", false);

        Assertions.assertEquals("v-1", req.vehicleId());
        Assertions.assertEquals("DOORSTEP", req.deliveryMethod());
        Assertions.assertFalse(req.driverRequired());
    }

    @Test
    void chatRequestHandlesNullFiltersGracefully() {
        ChatDtos.ChatRequest chat = new ChatDtos.ChatRequest("Show cars in Tirupati", null, null, null);
        Assertions.assertEquals("Show cars in Tirupati", chat.message());
        Assertions.assertNull(chat.city());
    }

    @Test
    void deliveryHandoverDtoValidatesValues() {
        DeliveryDtos.HandoverRequest handover = new DeliveryDtos.HandoverRequest("123456", 14200, 90, "Clean");
        Assertions.assertEquals("123456", handover.otp());
        Assertions.assertEquals(14200, handover.odometerReading());
        Assertions.assertEquals(90, handover.fuelPercent());
    }
}
