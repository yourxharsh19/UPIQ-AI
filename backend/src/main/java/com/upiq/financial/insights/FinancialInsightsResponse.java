package com.upiq.financial.insights;

import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.List;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;

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
    String topExpenseCategory;
    @JsonSerialize(using = ToStringSerializer.class)
    BigDecimal topExpenseCategoryTotal;
    List<String> insights;
    String explanation;
    boolean aiGenerated;
}
