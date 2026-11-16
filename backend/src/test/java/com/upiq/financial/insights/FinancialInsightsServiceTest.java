package com.upiq.financial.insights;

import com.upiq.research.llm.SystemCService;
import com.upiq.transaction.model.Transaction;
import com.upiq.transaction.repository.TransactionRepository;
import com.upiq.research.context.FinancialContext;
import org.mockito.ArgumentCaptor;
import org.junit.jupiter.api.Test;
import java.time.YearMonth;
import java.math.BigDecimal;
import java.util.List;
import static org.mockito.ArgumentMatchers.eq;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verify;

class FinancialInsightsServiceTest {
    @Test
    void aggregatesOnlyCurrentUserCurrentMonthFactsAndFallsBackWithoutOllama() {
        TransactionRepository repository = mock(TransactionRepository.class);
        SystemCService ollama = mock(SystemCService.class);
        YearMonth month = YearMonth.now();
        when(repository.findByUserIdAndDateBetweenOrderByDateDesc(org.mockito.ArgumentMatchers.eq(12L), any(), any())).thenReturn(List.of(
                tx(12L, "income", "Salary", 10000, month),
                tx(12L, "expense", "Food", 1200, month),
                tx(12L, "expense", "Rent", 3000, month),
                tx(12L, "expense", "Food", 800, month)));
        when(ollama.answer(anyString(), any())).thenThrow(new IllegalStateException("unavailable"));
        var response = new FinancialInsightsService(repository, ollama).getInsights(12L);
        assertEquals("10000.00", response.getIncome().toPlainString());
        assertEquals("5000.00", response.getExpenses().toPlainString());
        assertEquals("5000.00", response.getNet().toPlainString());
        assertEquals("Rent", response.getTopExpenseCategory());
        assertEquals("3000.0", response.getTopExpenseCategoryTotal().toPlainString());
        assertFalse(response.isAiGenerated());
        ArgumentCaptor<FinancialContext> context = ArgumentCaptor.forClass(FinancialContext.class);
        verify(ollama).answer(anyString(), context.capture());
        assertEquals("10000.00", context.getValue().getFacts().getTotalIncome().toPlainString());
        assertEquals("5000.00", context.getValue().getFacts().getTotalExpense().toPlainString());
        assertEquals("5000.00", context.getValue().getFacts().getNetBalance().toPlainString());
        assertEquals("Rent", context.getValue().getFacts().getCategory1());
        org.mockito.Mockito.verify(repository).findByUserIdAndDateBetweenOrderByDateDesc(
                eq(12L), eq(month.atDay(1).atStartOfDay()),
                eq(month.atEndOfMonth().plusDays(1).atStartOfDay().minusNanos(1)));
    }

    @Test
    void emptyHistoryProducesZeroTotalsWithoutCallingOllama() {
        TransactionRepository repository = mock(TransactionRepository.class);
        SystemCService ollama = mock(SystemCService.class);
        YearMonth month = YearMonth.now();
        when(repository.findByUserIdAndDateBetweenOrderByDateDesc(eq(12L), any(), any())).thenReturn(List.of());

        var response = new FinancialInsightsService(repository, ollama).getInsights(12L);

        assertEquals("0.00", response.getIncome().toPlainString());
        assertEquals("0.00", response.getExpenses().toPlainString());
        assertEquals("0.00", response.getNet().toPlainString());
        assertNull(response.getTopExpenseCategory());
        assertFalse(response.isAiGenerated());
        org.mockito.Mockito.verifyNoInteractions(ollama);
        verify(repository).findByUserIdAndDateBetweenOrderByDateDesc(
                eq(12L), eq(month.atDay(1).atStartOfDay()),
                eq(month.atEndOfMonth().plusDays(1).atStartOfDay().minusNanos(1)));
    }

    @Test
    void tiedCategoriesUseStableNameOrder() {
        TransactionRepository repository = mock(TransactionRepository.class);
        SystemCService ollama = mock(SystemCService.class);
        YearMonth month = YearMonth.now();
        when(repository.findByUserIdAndDateBetweenOrderByDateDesc(eq(12L), any(), any())).thenReturn(List.of(
                tx(12L, "expense", "Rent", 1000, month),
                tx(12L, "expense", "Food", 1000, month),
                tx(12L, "expense", " ", 500, month)));
        when(ollama.answer(anyString(), any())).thenThrow(new IllegalStateException("unavailable"));

        var response = new FinancialInsightsService(repository, ollama).getInsights(12L);

        assertEquals("Food", response.getTopExpenseCategory());
        assertEquals("1000.0", response.getTopExpenseCategoryTotal().toPlainString());
    }

    @Test
    void blankCategoryIsReportedAsUncategorizedWhenItHasTheLargestExpense() {
        TransactionRepository repository = mock(TransactionRepository.class);
        SystemCService ollama = mock(SystemCService.class);
        YearMonth month = YearMonth.now();
        when(repository.findByUserIdAndDateBetweenOrderByDateDesc(eq(12L), any(), any())).thenReturn(List.of(
                tx(12L, "expense", " ", 1500, month)));
        when(ollama.answer(anyString(), any())).thenThrow(new IllegalStateException("unavailable"));

        var response = new FinancialInsightsService(repository, ollama).getInsights(12L);

        assertEquals("Uncategorized", response.getTopExpenseCategory());
        assertEquals("1500.0", response.getTopExpenseCategoryTotal().toPlainString());
    }

    private static Transaction tx(Long user, String type, String category, double amount, YearMonth month) {
        return Transaction.builder().userId(user).type(type).category(category).amount(BigDecimal.valueOf(amount))
                .date(month.atDay(3).atStartOfDay()).build();
    }
}
