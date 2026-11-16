package com.upiq.financial.insights;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;

import java.math.BigDecimal;

public record CategorySpending(String category,
        @JsonSerialize(using = ToStringSerializer.class) BigDecimal total,
        BigDecimal percentageOfExpense,
        long transactionCount) {
}
