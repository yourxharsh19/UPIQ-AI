package com.upiq.research.calculation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NetBalanceResult {
    private Long userId;
    private PeriodRange period;
    @JsonSerialize(using = ToStringSerializer.class)
    private BigDecimal totalIncome;
    @JsonSerialize(using = ToStringSerializer.class)
    private BigDecimal totalExpense;
    @JsonSerialize(using = ToStringSerializer.class)
    private BigDecimal netBalance;
    private BigDecimal savingsRate;
    private long incomeTransactionCount;
    private long expenseTransactionCount;
}
