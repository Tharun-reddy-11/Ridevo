package com.ridenexa.delivery;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/delivery/tasks")
public class DeliveryController {
    private final DeliveryService delivery;

    public DeliveryController(DeliveryService delivery) {
        this.delivery = delivery;
    }

    @GetMapping("/my")
    public List<Map<String, Object>> myTasks() {
        return delivery.myTasks();
    }

    @GetMapping("/{id}")
    public Map<String, Object> task(@PathVariable String id) {
        return delivery.task(id);
    }

    @PatchMapping("/{id}/status")
    public Map<String, Object> updateStatus(@PathVariable String id, @Valid @RequestBody DeliveryDtos.UpdateStatusRequest input) {
        return delivery.updateStatus(id, input);
    }

    @PostMapping("/{id}/verify-licence")
    public Map<String, Object> verifyLicence(@PathVariable String id, @Valid @RequestBody DeliveryDtos.VerifyLicenceRequest input) {
        return delivery.verifyLicence(id, input);
    }

    @PostMapping("/{id}/handover")
    public Map<String, Object> handover(@PathVariable String id, @Valid @RequestBody DeliveryDtos.HandoverRequest input) {
        return delivery.handover(id, input);
    }

    @PostMapping("/{id}/return-inspection")
    public Map<String, Object> returnInspection(@PathVariable String id, @Valid @RequestBody DeliveryDtos.ReturnInspectionRequest input) {
        return delivery.returnInspection(id, input);
    }
}
