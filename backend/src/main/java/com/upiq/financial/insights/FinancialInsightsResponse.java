package com.upiq.financial.insights;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.List;

@Value
@Builder
public class FinancialInsightsResponse {
    YearMonth month;
    @JsonSerialize(using = ToStringSerializer.class)
    BigDecimal income;
    @JsonSerialize(using = ToStringSerializer.class)
    BigDecimal expenses;
    @JsonSerialize(using = ToStringSerializer.class)
    BigDecimal net;
    @JsonSerialize(using = ToStringSerializer.class)
    BigDecimal previousMonthExpenses;
    @JsonSerialize(using = ToStringSerializer.class)
    BigDecimal expenseChange;
    BigDecimal expenseChangePercentage;
    String topExpenseCategory;
    @JsonSerialize(using = ToStringSerializer.class)
    BigDecimal topExpenseCategoryTotal;
    List<CategorySpending> categoryBreakdown;
    List<BudgetInsight> budgetInsights;
    List<String> insights;
    String explanation;
    boolean aiGenerated;
}
