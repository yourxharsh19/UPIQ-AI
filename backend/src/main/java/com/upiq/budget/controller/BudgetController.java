package com.upiq.budget.controller;

import com.upiq.auth.model.User;
import com.upiq.budget.dto.BudgetRequest;
import com.upiq.budget.dto.BudgetResponse;
import com.upiq.budget.service.BudgetService;
import com.upiq.config.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.YearMonth;
import java.util.List;

@RestController
@RequestMapping("/api/budgets")
@RequiredArgsConstructor
public class BudgetController {
    private final BudgetService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<BudgetResponse>>> get(@AuthenticationPrincipal User user,
            @RequestParam(required = false) String month) {
        return ResponseEntity.ok(ApiResponse.success(service.getBudgets(user.getId(),
                month == null ? YearMonth.now().toString() : month), "Budgets retrieved"));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<BudgetResponse>> create(@AuthenticationPrincipal User user,
            @Valid @RequestBody BudgetRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(service.create(user.getId(), request), "Budget saved"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<BudgetResponse>> update(@AuthenticationPrincipal User user,
            @PathVariable Long id, @Valid @RequestBody BudgetRequest request) {
        return ResponseEntity.ok(ApiResponse.success(service.update(user.getId(), id, request), "Budget updated"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@AuthenticationPrincipal User user, @PathVariable Long id) {
        service.delete(user.getId(), id);
        return ResponseEntity.ok(ApiResponse.success(null, "Budget deleted"));
    }
}
