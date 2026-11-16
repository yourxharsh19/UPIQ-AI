package com.upiq.financial.insights;

import com.upiq.budget.repository.BudgetRepository;
import com.upiq.research.context.FinancialContext;
import com.upiq.research.llm.SystemCResponse;
import com.upiq.research.llm.SystemCService;
import com.upiq.transaction.model.Transaction;
import com.upiq.transaction.repository.TransactionRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class FinancialInsightsServiceTest {
    private final TransactionRepository transactions = mock(TransactionRepository.class);
    private final BudgetRepository budgets = mock(BudgetRepository.class);
    private final SystemCService ollama = mock(SystemCService.class);
    private final FinancialInsightsService service = new FinancialInsightsService(transactions, budgets, ollama);

    @Test
    void computesExactCurrentAndPreviousMonthAggregatesForTheRequestedUser() {
        YearMonth month = YearMonth.now();
        when(transactions.findByUserIdAndDateBetweenOrderByDateDesc(eq(12L), any(), any())).thenReturn(List.of(
                tx("income", "Salary", "10000.00", month.atDay(3).atTime(12, 0)),
                tx("expense", "Food", "1200.50", month.atDay(4).atStartOfDay()),
                tx("expense", "Rent", "3000.00", month.atDay(5).atStartOfDay()),
                tx("expense", "Food", "800.25", month.atDay(6).atStartOfDay()),
                tx("expense", "Food", "4000.00", month.minusMonths(1).atDay(3).atStartOfDay())));
        when(budgets.findByUser_IdAndPeriodStartOrderByCategoryAsc(eq(12L), eq(month.atDay(1)))).thenReturn(List.of());
        when(ollama.answer(anyString(), any())).thenThrow(new IllegalStateException("unavailable"));

        FinancialInsightsResponse response = service.getInsights(12L);

        assertEquals("10000.00", response.getIncome().toPlainString());
        assertEquals("5000.75", response.getExpenses().toPlainString());
        assertEquals("4999.25", response.getNet().toPlainString());
        assertEquals("4000.00", response.getPreviousMonthExpenses().toPlainString());
        assertEquals("1000.75", response.getExpenseChange().toPlainString());
        assertEquals("25.02", response.getExpenseChangePercentage().toPlainString());
        assertEquals("Rent", response.getTopExpenseCategory());
        assertEquals("3000.00", response.getTopExpenseCategoryTotal().toPlainString());
        assertEquals("Food", response.getCategoryBreakdown().get(1).category());
        assertEquals("2000.75", response.getCategoryBreakdown().get(1).total().toPlainString());
        assertFalse(response.isAiGenerated());

        ArgumentCaptor<FinancialContext> context = ArgumentCaptor.forClass(FinancialContext.class);
        verify(ollama).answer(anyString(), context.capture());
        assertEquals("10000.00", context.getValue().getFacts().getTotalIncome().toPlainString());
        assertEquals("5000.75", context.getValue().getFacts().getTotalExpense().toPlainString());
        assertEquals("4000.00", context.getValue().getFacts().getBaselineTotal().toPlainString());
        verify(transactions).findByUserIdAndDateBetweenOrderByDateDesc(eq(12L),
                eq(month.minusMonths(1).atDay(1).atStartOfDay()),
                eq(month.plusMonths(1).atDay(1).atStartOfDay().minusNanos(1)));
        verify(budgets).findByUser_IdAndPeriodStartOrderByCategoryAsc(12L, month.atDay(1));
    }

    @Test
    void emptyHistoryReturnsExactZerosAndSkipsOllama() {
        YearMonth month = YearMonth.now();
        when(transactions.findByUserIdAndDateBetweenOrderByDateDesc(eq(12L), any(), any())).thenReturn(List.of());
        when(budgets.findByUser_IdAndPeriodStartOrderByCategoryAsc(eq(12L), any())).thenReturn(List.of());

        FinancialInsightsResponse response = service.getInsights(12L);

        assertEquals("0.00", response.getIncome().toPlainString());
        assertEquals("0.00", response.getExpenses().toPlainString());
        assertEquals("0.00", response.getPreviousMonthExpenses().toPlainString());
        assertNull(response.getTopExpenseCategory());
        assertTrue(response.getCategoryBreakdown().isEmpty());
        assertFalse(response.isAiGenerated());
        verifyNoInteractions(ollama);
        verify(transactions).findByUserIdAndDateBetweenOrderByDateDesc(eq(12L),
                eq(month.minusMonths(1).atDay(1).atStartOfDay()),
                eq(month.plusMonths(1).atDay(1).atStartOfDay().minusNanos(1)));
    }

    @Test
    void rejectsModelExplanationsContainingUnsupportedFigures() {
        YearMonth month = YearMonth.now();
        when(transactions.findByUserIdAndDateBetweenOrderByDateDesc(eq(12L), any(), any()))
                .thenReturn(List.of(tx("expense", "Food", "100.00", month.atDay(1).atStartOfDay())));
        when(budgets.findByUser_IdAndPeriodStartOrderByCategoryAsc(eq(12L), any())).thenReturn(List.of());
        when(ollama.answer(anyString(), any())).thenReturn(SystemCResponse.builder()
                .answer("You may save 500 rupees next month.").build());

        FinancialInsightsResponse response = service.getInsights(12L);

        assertFalse(response.isAiGenerated());
        assertEquals("The figures and observations below are calculated from your recorded transactions.", response.getExplanation());
    }

    @Test
    void acceptsQualitativeExplanationButFinancialFiguresRemainDeterministic() {
        YearMonth month = YearMonth.now();
        when(transactions.findByUserIdAndDateBetweenOrderByDateDesc(eq(12L), any(), any()))
                .thenReturn(List.of(tx("expense", "Food", "100.00", month.atDay(1).atStartOfDay())));
        when(budgets.findByUser_IdAndPeriodStartOrderByCategoryAsc(eq(12L), any())).thenReturn(List.of());
        when(ollama.answer(anyString(), any())).thenReturn(SystemCResponse.builder()
                .answer("Review the largest spending areas and compare them with your monthly plan.").build());

        FinancialInsightsResponse response = service.getInsights(12L);

        assertTrue(response.isAiGenerated());
        assertEquals("100.00", response.getExpenses().toPlainString());
        assertEquals("Food", response.getTopExpenseCategory());
    }

    @Test
    void previousMonthZeroHasNoUndefinedPercentage() {
        YearMonth month = YearMonth.now();
        when(transactions.findByUserIdAndDateBetweenOrderByDateDesc(eq(12L), any(), any()))
                .thenReturn(List.of(tx("expense", "Food", "1.25", month.atDay(1).atStartOfDay())));
        when(budgets.findByUser_IdAndPeriodStartOrderByCategoryAsc(eq(12L), any())).thenReturn(List.of());
        when(ollama.answer(anyString(), any())).thenThrow(new IllegalStateException("unavailable"));

        FinancialInsightsResponse response = service.getInsights(12L);

        assertNull(response.getExpenseChangePercentage());
        assertEquals("1.25", response.getExpenses().toPlainString());
    }

    private static Transaction tx(String type, String category, String amount, LocalDateTime date) {
        return Transaction.builder().userId(12L).type(type).category(category)
                .amount(new BigDecimal(amount)).date(date).build();
    }
}
