package com.upiq.research.calculation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;

/**
 * Result for comparing two categories within the same period and transaction type.
 *
 * <p>Formulas:
 * <pre>
 *   absoluteDifference  = category1Total - category2Total
 *   percentageDifference = ((category1Total - category2Total) / category2Total) × 100
 * </pre>
 * When category2Total is zero the percentageDifference is set to null and
 * zeroDenominator is set to true.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryComparisonResult {
    private Long userId;
    private String transactionType;
    private PeriodRange period;
    private String category1;
    @JsonSerialize(using = ToStringSerializer.class)
    private BigDecimal category1Total;
    private long category1TransactionCount;
    private String category2;
    @JsonSerialize(using = ToStringSerializer.class)
    private BigDecimal category2Total;
    private long category2TransactionCount;
    @JsonSerialize(using = ToStringSerializer.class)
    private BigDecimal absoluteDifference;
    /** Null when category2Total is zero. */
    private BigDecimal percentageDifference;
    private boolean zeroDenominator;
    /** The name of whichever category has the higher total. */
    private String higherCategory;
}
