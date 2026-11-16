package com.upiq.financial.insights;

import com.upiq.auth.model.User;
import com.upiq.config.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/financial-insights")
@RequiredArgsConstructor
public class FinancialInsightsController {
    private final FinancialInsightsService service;
    @GetMapping
    public ResponseEntity<ApiResponse<FinancialInsightsResponse>> get(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(service.getInsights(user.getId()), "Financial insights generated"));
    }
}
