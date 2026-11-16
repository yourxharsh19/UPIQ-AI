package com.upiq.financial.investments;

import com.upiq.auth.model.User;
import com.upiq.config.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/investment-suggestions")
@RequiredArgsConstructor
public class InvestmentSuggestionsController {
    private final InvestmentSuggestionsService service;

    @GetMapping
    public ResponseEntity<ApiResponse<InvestmentSuggestionsResponse>> get(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(service.getSuggestions(user.getId()),
                "Educational investment suggestions generated"));
    }
}
