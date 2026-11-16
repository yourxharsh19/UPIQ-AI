package com.upiq.research.calculation.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;

/**
 * Result for spending concentration analysis.
 *
 * <p>
 * Definition used (research-friendly):
 * 
 * <pre>
 *   topNAmount         = sum of the top-N expense transactions in the period
 *   spendingConcentration = topNAmount / totalExpense × 100
 * </pre>
 * 
 * This tells us what percentage of total expenditure is accounted for by the
 * N largest individual transactions, providing a simple deterministic indicator
 * of spending skew.
 *
 * <p>
 * When totalExpense is zero the concentration is set to zero and
 * zeroDenominator is true.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SpendingConcentrationResult {
    private Long userId;
    private PeriodRange period;
    private int topN;
    @JsonSerialize(using = ToStringSerializer.class)
    private BigDecimal totalExpense;
    @JsonSerialize(using = ToStringSerializer.class)
    private BigDecimal topNAmount;
    /** Top-N expense percentage of total expense (0–100). */
    private BigDecimal concentrationPercentage;
    private boolean zeroDenominator;
    private List<TopTransactionEntry> topTransactions;
}
