package com.upiq.research.context;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonPropertyOrder;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.Builder;
import lombok.Value;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.ser.std.ToStringSerializer;

/**
 * Verified numeric and categorical facts only. No prompt instructions.
 */
@Value
@Builder
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonPropertyOrder({
        "category",
        "comparisonCategory",
        "transactionType",
        "totalIncome",
        "totalExpense",
        "netBalance",
        "savingsRate",
        "incomeTransactionCount",
        "expenseTransactionCount",
        "transactionCount",
        "percentageOfTotalExpense",
        "category1",
        "category1Total",
        "category1TransactionCount",
        "category2",
        "category2Total",
        "category2TransactionCount",
        "higherCategory",
        "baselineTotal",
        "currentTotal",
        "baselineTransactionCount",
        "currentTransactionCount",
        "absoluteDifference",
        "percentageDifference",
        "zeroDenominator",
        "increased",
        "found",
        "amount",
        "description",
        "date",
        "paymentMethod",
        "rank",
        "transactionId"
})
public class FinancialFacts {

    String category;
    String comparisonCategory;
    String transactionType;
    @JsonSerialize(using = ToStringSerializer.class)
    BigDecimal totalIncome;
    @JsonSerialize(using = ToStringSerializer.class)
    BigDecimal totalExpense;
    @JsonSerialize(using = ToStringSerializer.class)
    BigDecimal netBalance;
    BigDecimal savingsRate;
    Long incomeTransactionCount;
    Long expenseTransactionCount;
    Long transactionCount;
    BigDecimal percentageOfTotalExpense;
    String category1;
    @JsonSerialize(using = ToStringSerializer.class)
    BigDecimal category1Total;
    Long category1TransactionCount;
    String category2;
    @JsonSerialize(using = ToStringSerializer.class)
    BigDecimal category2Total;
    Long category2TransactionCount;
    String higherCategory;
    @JsonSerialize(using = ToStringSerializer.class)
    BigDecimal baselineTotal;
    @JsonSerialize(using = ToStringSerializer.class)
    BigDecimal currentTotal;
    Long baselineTransactionCount;
    Long currentTransactionCount;
    @JsonSerialize(using = ToStringSerializer.class)
    BigDecimal absoluteDifference;
    BigDecimal percentageDifference;
    Boolean zeroDenominator;
    Boolean increased;
    Boolean found;
    @JsonSerialize(using = ToStringSerializer.class)
    BigDecimal amount;
    String description;
    LocalDateTime date;
    String paymentMethod;
    Integer rank;
    Long transactionId;
}
