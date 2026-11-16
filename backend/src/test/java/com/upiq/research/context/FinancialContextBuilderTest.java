package com.upiq.research.context;

import com.upiq.research.calculation.dto.CategoryComparisonResult;
import com.upiq.research.calculation.dto.CategoryTotalResult;
import com.upiq.research.calculation.dto.NetBalanceResult;
import com.upiq.research.calculation.dto.PeriodComparisonResult;
import com.upiq.research.calculation.dto.PeriodRange;
import com.upiq.research.calculation.dto.TopTransactionEntry;
import com.upiq.research.intent.CalculationType;
import com.upiq.research.intent.DispatchedCalculation;
import com.upiq.research.intent.FinancialQueryIntent;
import com.upiq.research.intent.InvalidFinancialIntentException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("FinancialContextBuilder")
class FinancialContextBuilderTest {

    private static final PeriodRange AUG = PeriodRange.of(LocalDate.of(2026, 8, 1), LocalDate.of(2026, 8, 31));
    private static final PeriodRange JUL = PeriodRange.of(LocalDate.of(2026, 7, 1), LocalDate.of(2026, 7, 31));

    private final FinancialContextBuilder builder = new FinancialContextBuilder();

    @Test
    @DisplayName("CATEGORY_EXPENSE_TOTAL context matches verified category total")
    void categoryExpenseTotalContext() {
        FinancialQueryIntent intent = baseIntent(CalculationType.CATEGORY_EXPENSE_TOTAL).toBuilder()
                .category("Food")
                .transactionType("expense")
                .build();
        CategoryTotalResult result = CategoryTotalResult.builder()
                .category("Food")
                .transactionType("expense")
                .period(AUG)
                .total(new BigDecimal("3620.00"))
                .transactionCount(6)
                .percentageOfTotalExpense(new BigDecimal("27.50"))
                .build();

        FinancialContext context = builder.build(intent, result);
        String json = builder.toJson(context);

        assertThat(context.isVerified()).isTrue();
        assertThat(context.getContextVersion()).isEqualTo("1.0");
        assertThat(context.getSource()).isEqualTo(FinancialContext.SOURCE);
        assertThat(context.getCalculationType()).isEqualTo("CATEGORY_EXPENSE_TOTAL");
        assertThat(context.getPeriod().getStart()).isEqualTo(LocalDate.of(2026, 8, 1));
        assertThat(context.getPeriod().getEnd()).isEqualTo(LocalDate.of(2026, 8, 31));
        assertThat(context.getFacts().getCategory()).isEqualTo("Food");
        assertThat(context.getFacts().getTotalExpense()).isEqualByComparingTo("3620.00");
        assertThat(context.getFacts().getTransactionCount()).isEqualTo(6L);
        assertThat(context.getFacts().getPercentageOfTotalExpense()).isEqualByComparingTo("27.50");
        assertThat(json).contains("\"context_version\":\"1.0\"");
        assertThat(json).contains("\"verified\":true");
        assertThat(json).contains("\"calculation_type\":\"CATEGORY_EXPENSE_TOTAL\"");
        assertThat(json).contains("\"total_expense\":\"3620.00\"");
        assertThat(json).doesNotContain("You are");
        assertThat(json).doesNotContain("prompt");
    }

    @Test
    @DisplayName("TOTAL_INCOME context uses independently known 85000.00")
    void totalIncomeContext() {
        FinancialQueryIntent intent = baseIntent(CalculationType.TOTAL_INCOME).toBuilder()
                .transactionType("income")
                .build();

        FinancialContext context = builder.build(intent, new BigDecimal("85000.00"));

        assertThat(context.getCalculationType()).isEqualTo("TOTAL_INCOME");
        assertThat(context.getFacts().getTotalIncome()).isEqualByComparingTo("85000.00");
        assertThat(context.getFacts().getTotalExpense()).isNull();
    }

    @Test
    @DisplayName("TOTAL_EXPENSE context uses independently known 13166.00")
    void totalExpenseContext() {
        FinancialQueryIntent intent = baseIntent(CalculationType.TOTAL_EXPENSE).toBuilder()
                .transactionType("expense")
                .build();

        FinancialContext context = builder.build(intent, new BigDecimal("13166.00"));

        assertThat(context.getFacts().getTotalExpense()).isEqualByComparingTo("13166.00");
        assertThat(context.getPeriod().getStart()).isEqualTo(LocalDate.of(2026, 8, 1));
    }

    @Test
    void netBalanceContextUsesExistingVerifiedEngineResult() {
        FinancialQueryIntent intent = baseIntent(CalculationType.NET_BALANCE);
        NetBalanceResult result = NetBalanceResult.builder()
                .totalIncome(new BigDecimal("5000.00"))
                .totalExpense(new BigDecimal("3620.00"))
                .netBalance(new BigDecimal("1380.00"))
                .savingsRate(new BigDecimal("27.60"))
                .incomeTransactionCount(2)
                .expenseTransactionCount(6)
                .build();

        FinancialContext context = builder.build(intent, result);

        assertThat(context.getFacts().getNetBalance()).isEqualByComparingTo("1380.00");
        assertThat(context.getFacts().getTotalIncome()).isEqualByComparingTo("5000.00");
        assertThat(context.getFacts().getTotalExpense()).isEqualByComparingTo("3620.00");
        assertThat(context.getFacts().getSavingsRate()).isEqualByComparingTo("27.60");
    }

    @Test
    @DisplayName("CATEGORY_COMPARE includes both totals and higher category")
    void categoryCompareContext() {
        FinancialQueryIntent intent = baseIntent(CalculationType.CATEGORY_COMPARE).toBuilder()
                .category("Food")
                .comparisonCategory("Transportation")
                .transactionType("expense")
                .build();
        CategoryComparisonResult result = CategoryComparisonResult.builder()
                .category1("Food")
                .category1Total(new BigDecimal("3620.00"))
                .category1TransactionCount(6)
                .category2("Transportation")
                .category2Total(new BigDecimal("2000.00"))
                .category2TransactionCount(3)
                .absoluteDifference(new BigDecimal("1620.00"))
                .percentageDifference(new BigDecimal("81.00"))
                .zeroDenominator(false)
                .higherCategory("Food")
                .transactionType("expense")
                .build();

        FinancialContext context = builder.build(intent, result);

        assertThat(context.getFacts().getCategory1Total()).isEqualByComparingTo("3620.00");
        assertThat(context.getFacts().getCategory2Total()).isEqualByComparingTo("2000.00");
        assertThat(context.getFacts().getAbsoluteDifference()).isEqualByComparingTo("1620.00");
        assertThat(context.getFacts().getHigherCategory()).isEqualTo("Food");
        assertThat(context.getFacts().getCategory1TransactionCount()).isEqualTo(6L);
        assertThat(context.getFacts().getCategory2TransactionCount()).isEqualTo(3L);
    }

    @Test
    @DisplayName("PERIOD_EXPENSE_COMPARE includes comparison period and difference")
    void periodExpenseCompareContext() {
        FinancialQueryIntent intent = baseIntent(CalculationType.PERIOD_EXPENSE_COMPARE).toBuilder()
                .transactionType("expense")
                .comparisonPeriod(JUL)
                .build();
        PeriodComparisonResult result = PeriodComparisonResult.builder()
                .transactionType("expense")
                .period1Total(new BigDecimal("11356.00"))
                .period2Total(new BigDecimal("13166.00"))
                .absoluteDifference(new BigDecimal("1810.00"))
                .percentageDifference(new BigDecimal("15.94"))
                .zeroDenominator(false)
                .period1TransactionCount(10)
                .period2TransactionCount(12)
                .build();

        FinancialContext context = builder.build(intent, result);

        assertThat(context.getComparisonPeriod().getStart()).isEqualTo(LocalDate.of(2026, 7, 1));
        assertThat(context.getFacts().getBaselineTotal()).isEqualByComparingTo("11356.00");
        assertThat(context.getFacts().getCurrentTotal()).isEqualByComparingTo("13166.00");
        assertThat(context.getFacts().getAbsoluteDifference()).isEqualByComparingTo("1810.00");
        assertThat(context.getFacts().getIncreased()).isTrue();
        assertThat(context.getFacts().getBaselineTransactionCount()).isEqualTo(10L);
        assertThat(context.getFacts().getCurrentTransactionCount()).isEqualTo(12L);
    }

    @Test
    @DisplayName("SPENDING_TREND marks increased=false when spend fell")
    void spendingTrendDecreased() {
        FinancialQueryIntent intent = baseIntent(CalculationType.SPENDING_TREND).toBuilder()
                .transactionType("expense")
                .comparisonPeriod(JUL)
                .build();
        PeriodComparisonResult result = PeriodComparisonResult.builder()
                .absoluteDifference(new BigDecimal("-500.00"))
                .period1Total(new BigDecimal("1000.00"))
                .period2Total(new BigDecimal("500.00"))
                .zeroDenominator(false)
                .build();

        FinancialContext context = builder.build(intent, result);

        assertThat(context.getCalculationType()).isEqualTo("SPENDING_TREND");
        assertThat(context.getFacts().getIncreased()).isFalse();
    }

    @Test
    @DisplayName("LARGEST_TRANSACTION copies verified top-1 entry")
    void largestTransactionContext() {
        FinancialQueryIntent intent = baseIntent(CalculationType.LARGEST_TRANSACTION).toBuilder()
                .transactionType("expense")
                .limit(1)
                .build();
        TopTransactionEntry entry = TopTransactionEntry.builder()
                .transactionId(109L)
                .amount(new BigDecimal("2100.00"))
                .type("expense")
                .category("Utilities")
                .description("BESCOM electricity bill")
                .date(LocalDateTime.of(2026, 8, 6, 10, 0))
                .paymentMethod("Net Banking")
                .rank(1)
                .build();

        FinancialContext context = builder.build(intent, List.of(entry));

        assertThat(context.getFacts().getFound()).isTrue();
        assertThat(context.getFacts().getAmount()).isEqualByComparingTo("2100.00");
        assertThat(context.getFacts().getCategory()).isEqualTo("Utilities");
        assertThat(context.getFacts().getRank()).isEqualTo(1);
        assertThat(context.getFacts().getTransactionId()).isEqualTo(109L);
    }

    @Test
    @DisplayName("serialization is deterministic")
    void deterministicSerialization() {
        FinancialQueryIntent intent = baseIntent(CalculationType.TOTAL_EXPENSE).toBuilder()
                .transactionType("expense")
                .build();
        FinancialContext context = builder.build(intent, new BigDecimal("13166.00"));

        String first = builder.toJson(context);
        String second = builder.toJson(context);

        assertThat(first).isEqualTo(second);
        assertThat(first).isEqualTo(builder.toJson(new DispatchedCalculation(intent, new BigDecimal("13166.00"))));
    }

    @Nested
    @DisplayName("edge cases")
    class EdgeCases {

        @Test
        void emptyCategoryTotal() {
            FinancialQueryIntent intent = baseIntent(CalculationType.CATEGORY_EXPENSE_TOTAL).toBuilder()
                    .category("Healthcare")
                    .transactionType("expense")
                    .build();
            CategoryTotalResult result = CategoryTotalResult.builder()
                    .category("Healthcare")
                    .transactionType("expense")
                    .total(new BigDecimal("0.00"))
                    .transactionCount(0)
                    .percentageOfTotalExpense(BigDecimal.ZERO)
                    .build();

            FinancialContext context = builder.build(intent, result);

            assertThat(context.isVerified()).isTrue();
            assertThat(context.getFacts().getTotalExpense()).isEqualByComparingTo("0.00");
            assertThat(context.getFacts().getTransactionCount()).isEqualTo(0L);
        }

        @Test
        void zeroExpenseTotal() {
            FinancialQueryIntent intent = baseIntent(CalculationType.TOTAL_EXPENSE).toBuilder()
                    .transactionType("expense")
                    .build();

            FinancialContext context = builder.build(intent, new BigDecimal("0.00"));

            assertThat(context.getFacts().getTotalExpense()).isEqualByComparingTo("0.00");
        }

        @Test
        void largestTransactionEmptySet() {
            FinancialQueryIntent intent = baseIntent(CalculationType.LARGEST_TRANSACTION).toBuilder()
                    .transactionType("expense")
                    .build();

            FinancialContext context = builder.build(intent, Collections.emptyList());

            assertThat(context.getFacts().getFound()).isFalse();
            assertThat(context.getFacts().getTransactionCount()).isEqualTo(0L);
            assertThat(context.getFacts().getAmount()).isNull();
        }

        @Test
        void periodCompareZeroBaseline() {
            FinancialQueryIntent intent = baseIntent(CalculationType.PERIOD_EXPENSE_COMPARE).toBuilder()
                    .transactionType("expense")
                    .comparisonPeriod(JUL)
                    .build();
            PeriodComparisonResult result = PeriodComparisonResult.builder()
                    .period1Total(BigDecimal.ZERO.setScale(2))
                    .period2Total(new BigDecimal("100.00"))
                    .absoluteDifference(new BigDecimal("100.00"))
                    .percentageDifference(null)
                    .zeroDenominator(true)
                    .build();

            FinancialContext context = builder.build(intent, result);

            assertThat(context.getFacts().getZeroDenominator()).isTrue();
            assertThat(context.getFacts().getPercentageDifference()).isNull();
            assertThat(context.getFacts().getIncreased()).isTrue();
        }

        @Test
        void wrongResultTypeFails() {
            FinancialQueryIntent intent = baseIntent(CalculationType.TOTAL_INCOME).toBuilder()
                    .transactionType("income")
                    .build();

            assertThatThrownBy(() -> builder.build(intent, "85000"))
                    .isInstanceOf(InvalidFinancialIntentException.class)
                    .hasMessageContaining("BigDecimal");
        }

        @Test
        void nullResultFails() {
            FinancialQueryIntent intent = baseIntent(CalculationType.TOTAL_INCOME).toBuilder()
                    .transactionType("income")
                    .build();

            assertThatThrownBy(() -> builder.build(intent, null))
                    .isInstanceOf(InvalidFinancialIntentException.class);
        }

        @Test
        void unsupportedTypeCannotBuildContext() {
            FinancialQueryIntent intent = baseIntent(CalculationType.RECURRING_EXPENSE_TOTAL).toBuilder()
                    .transactionType("expense")
                    .recurringOnly(true)
                    .build();

            assertThatThrownBy(() -> builder.build(intent, new BigDecimal("100.00")))
                    .isInstanceOf(InvalidFinancialIntentException.class)
                    .hasMessageContaining("unsupported");
        }
    }

    private static FinancialQueryIntent baseIntent(CalculationType type) {
        return FinancialQueryIntent.builder()
                .calculationType(type)
                .userId(1L)
                .questionId("Q001")
                .period(AUG)
                .build();
    }
}
