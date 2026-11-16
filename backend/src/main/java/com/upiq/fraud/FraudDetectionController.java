package com.upiq.fraud;

import com.upiq.auth.model.User;
import com.upiq.config.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/fraud-alerts")
@RequiredArgsConstructor
public class FraudDetectionController {
    private final FraudDetectionService service;

    @GetMapping
    public ResponseEntity<ApiResponse<FraudAlertsResponse>> getAlerts(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(service.getAlerts(user.getId()), "Transaction review signals generated"));
    }
}
