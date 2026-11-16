package com.upiq.budget.dto;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;

import java.math.BigDecimal;
import java.time.LocalDate;

public record BudgetResponse(
        Long id,
        String category,
        LocalDate periodStart,
        @JsonSerialize(using = ToStringSerializer.class) BigDecimal amount,
        @JsonSerialize(using = ToStringSerializer.class) BigDecimal spent,
        @JsonSerialize(using = ToStringSerializer.class) BigDecimal remaining,
        @JsonSerialize(using = ToStringSerializer.class) BigDecimal projectedSpend,
        BigDecimal percentageConsumed,
        boolean overBudget) {
}
