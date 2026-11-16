package com.upiq.financial.investments;

import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;
import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.List;

@Value
@Builder
public class InvestmentSuggestionsResponse {
    YearMonth month;
    @JsonSerialize(using = ToStringSerializer.class)
    BigDecimal income;
    @JsonSerialize(using = ToStringSerializer.class)
    BigDecimal expenses;
    @JsonSerialize(using = ToStringSerializer.class)
    BigDecimal monthlySurplus;
    @JsonSerialize(using = ToStringSerializer.class)
    BigDecimal savingsRatePercentage;
    String cashFlowStatus;
    List<InvestmentSuggestion> suggestions;
    String explanation;
    boolean aiGenerated;
    String disclaimer;
}
