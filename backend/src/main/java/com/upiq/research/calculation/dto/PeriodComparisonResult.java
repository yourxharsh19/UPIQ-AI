package com.upiq.research.calculation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;

/**
 * Result for comparing the same transaction type (income or expense) across two time periods.
 *
 * <p>Period 1 is treated as the <em>baseline</em> and period 2 as the <em>current</em> value.
 *
 * <p>Formulas:
 * <pre>
 *   absoluteDifference  = period2Total - period1Total
 *   percentageDifference = ((period2Total - period1Total) / period1Total) × 100
 * </pre>
 * When period1Total is zero the percentageDifference is set to null and
 * zeroDenominator is set to true to signal that the percentage is undefined.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PeriodComparisonResult {
    private Long userId;
    private String transactionType;
    private PeriodRange period1;
    private PeriodRange period2;
    @JsonSerialize(using = ToStringSerializer.class)
    private BigDecimal period1Total;
    @JsonSerialize(using = ToStringSerializer.class)
    private BigDecimal period2Total;
    @JsonSerialize(using = ToStringSerializer.class)
    private BigDecimal absoluteDifference;
    /** Null when period1Total is zero. */
    private BigDecimal percentageDifference;
    private boolean zeroDenominator;
    private long period1TransactionCount;
    private long period2TransactionCount;
}
