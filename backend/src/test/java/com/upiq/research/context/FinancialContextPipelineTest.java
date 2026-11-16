package com.upiq.research.context;

import com.upiq.research.calculation.FinancialCalculationService;
import com.upiq.research.intent.DispatchedCalculation;
import com.upiq.research.intent.FinancialIntentDispatcher;
import com.upiq.research.intent.FinancialIntentMapper;
import com.upiq.research.dataset.dto.BenchmarkQuestionDefinition;
import com.upiq.transaction.model.Transaction;
import com.upiq.transaction.repository.TransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

/**
 * Pipeline tests: independent expected totals → calculation engine → structured context.
 * Expected values are arithmetic on the mock rows, not copies of the production output.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Checkpoint 2 calculation → context pipeline")
class FinancialContextPipelineTest {

    @Mock
    private TransactionRepository transactionRepository;

    private FinancialIntentDispatcher dispatcher;
    private FinancialContextBuilder contextBuilder;

    @BeforeEach
    void setUp() {
        FinancialCalculationService calculationService = new FinancialCalculationService(transactionRepository);
        dispatcher = new FinancialIntentDispatcher(new FinancialIntentMapper(), calculationService);
        contextBuilder = new FinancialContextBuilder();
    }

    @Test
    @DisplayName("Food Aug total: 650+400+800+300+500+970 = 3620 appears in context")
    void categoryExpenseIndependentGroundTruth() {
        // Independent expected: 650+400+800+300+500+970 = 3620
        List<Transaction> food = List.of(
                expense(1L, 650),
                expense(2L, 400),
                expense(3L, 800),
                expense(4L, 300),
                expense(5L, 500),
                expense(6L, 970)
        );
        List<Transaction> allExpense = List.of(
                expense(1L, 650), expense(2L, 400), expense(3L, 800),
                expense(4L, 300), expense(5L, 500), expense(6L, 970),
                expense(7L, 2000), expense(8L, 2100), expense(9L, 1800),
                expense(10L, 1200), expense(11L, 2446)
        );
        // Independent all-expense total: 3620 + 2000 + 2100 + 1800 + 1200 + 2446 = 13166
        // Independent food share: 3620 / 13166 * 100 = 27.4943... → 27.49 HALF_UP? 
        // 3620 / 13166 = 0.275010633... * 100 = 27.501063... → 27.50 HALF_UP

        when(transactionRepository.findByUserIdAndTypeIgnoreCaseAndCategoryIgnoreCaseAndDateBetweenOrderByDateDesc(
                eq(1L), eq("expense"), eq("Food"), any(), any()))
                .thenReturn(food);
        when(transactionRepository.findByUserIdAndTypeIgnoreCaseAndDateBetweenOrderByDateDesc(
                eq(1L), eq("expense"), any(), any()))
                .thenReturn(allExpense);

        BenchmarkQuestionDefinition question = BenchmarkQuestionDefinition.builder()
                .id("Q001")
                .text("How much did I spend on Food in August 2026?")
                .calculationType("CATEGORY_EXPENSE_TOTAL")
                .profileId("profile_01")
                .category("Food")
                .transactionType("expense")
                .startDate("2026-08-01")
                .endDate("2026-08-31")
                .build();

        DispatchedCalculation dispatched = dispatcher.dispatch(question, 1L);
        FinancialContext context = contextBuilder.build(dispatched);

        assertThat(context.getFacts().getTotalExpense()).isEqualByComparingTo("3620.00");
        assertThat(context.getFacts().getTransactionCount()).isEqualTo(6L);
        assertThat(context.getFacts().getPercentageOfTotalExpense()).isEqualByComparingTo("27.50");
        assertThat(context.isVerified()).isTrue();
        assertThat(contextBuilder.toJson(context)).contains("3620.00");
    }

    @Test
    @DisplayName("empty expense set yields verified zero context")
    void emptyExpenseSet() {
        when(transactionRepository.findByUserIdAndTypeIgnoreCaseAndDateBetweenOrderByDateDesc(
                eq(1L), eq("expense"), any(), any()))
                .thenReturn(Collections.emptyList());

        BenchmarkQuestionDefinition question = BenchmarkQuestionDefinition.builder()
                .id("Q004")
                .text("What was my total expenditure in August 2026?")
                .calculationType("TOTAL_EXPENSE")
                .profileId("profile_01")
                .transactionType("expense")
                .startDate("2026-08-01")
                .endDate("2026-08-31")
                .build();

        FinancialContext context = contextBuilder.build(dispatcher.dispatch(question, 1L));

        assertThat(context.getFacts().getTotalExpense()).isEqualByComparingTo("0.00");
        assertThat(context.isVerified()).isTrue();
    }

    private static Transaction expense(long id, double amount) {
        return Transaction.builder()
                .id(id)
                .userId(1L)
                .amount(BigDecimal.valueOf(amount))
                .type("expense")
                .category("Food")
                .description("row")
                .date(LocalDateTime.of(2026, 8, 10, 12, 0))
                .paymentMethod("UPI")
                .build();
    }
}
