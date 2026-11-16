package com.upiq.financial.insights;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;

import java.math.BigDecimal;

public record BudgetInsight(String category,
        @JsonSerialize(using = ToStringSerializer.class) BigDecimal amount,
        @JsonSerialize(using = ToStringSerializer.class) BigDecimal spent,
        @JsonSerialize(using = ToStringSerializer.class) BigDecimal remaining,
        BigDecimal percentageConsumed,
        boolean overBudget) {
}
