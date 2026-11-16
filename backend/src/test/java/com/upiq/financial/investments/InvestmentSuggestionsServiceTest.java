package com.upiq.financial.investments;

import com.upiq.research.llm.SystemCResponse;
import com.upiq.research.llm.SystemCService;
import com.upiq.transaction.model.Transaction;
import com.upiq.transaction.repository.TransactionRepository;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class InvestmentSuggestionsServiceTest {
    private final TransactionRepository transactions = mock(TransactionRepository.class);
    private final SystemCService explanations = mock(SystemCService.class);
    private final InvestmentSuggestionsService service = new InvestmentSuggestionsService(transactions, explanations);

    @Test
    void calculatesCurrentMonthCashFlowDeterministicallyAndFiltersForeignOrOutOfMonthRows() {
        YearMonth month = YearMonth.now();
        when(transactions.findByUserIdAndDateBetweenOrderByDateDesc(eq(10L), any(), any())).thenReturn(List.of(
                tx(10L, "income", "10000.00", month.atDay(2).atStartOfDay()),
                tx(10L, "expense", "2500.25", month.atDay(3).atStartOfDay()),
                tx(11L, "income", "90000.00", month.atDay(4).atStartOfDay()),
                tx(10L, "income", "70000.00", month.plusMonths(1).atDay(1).atStartOfDay())));
        when(explanations.answer(anyString(), any())).thenThrow(new IllegalStateException("offline"));

        InvestmentSuggestionsResponse result = service.getSuggestions(10L);

        assertEquals("10000.00", result.getIncome().toPlainString());
        assertEquals("2500.25", result.getExpenses().toPlainString());
        assertEquals("7499.75", result.getMonthlySurplus().toPlainString());
        assertEquals("75.00", result.getSavingsRatePercentage().toPlainString());
        assertEquals("POSITIVE_SURPLUS", result.getCashFlowStatus());
        assertFalse(result.isAiGenerated());
        assertTrue(result.getDisclaimer().contains("not personalized professional financial advice"));
        verify(transactions).findByUserIdAndDateBetweenOrderByDateDesc(eq(10L),
                eq(month.atDay(1).atStartOfDay()), eq(month.plusMonths(1).atDay(1).atStartOfDay().minusNanos(1)));
    }

    @Test
    void negativeCashFlowProducesOnlyCashFlowReviewSuggestion() {
        YearMonth month = YearMonth.now();
        when(transactions.findByUserIdAndDateBetweenOrderByDateDesc(eq(10L), any(), any()))
                .thenReturn(List.of(tx(10L, "income", "100.00", month.atDay(1).atStartOfDay()),
                        tx(10L, "expense", "150.00", month.atDay(2).atStartOfDay())));
        when(explanations.answer(anyString(), any())).thenReturn(SystemCResponse.builder()
                .answer("Reviewing regular cash flow can help clarify near-term financial priorities.").build());

        InvestmentSuggestionsResponse result = service.getSuggestions(10L);

        assertEquals("-50.00", result.getMonthlySurplus().toPlainString());
        assertEquals("-50.00", result.getSavingsRatePercentage().toPlainString());
        assertEquals("NO_SURPLUS", result.getCashFlowStatus());
        assertEquals("cash-flow-review", result.getSuggestions().get(0).code());
        assertTrue(result.isAiGenerated());
    }

    @Test
    void emptyMonthReturnsEducationalPromptAndDoesNotCallExplanationService() {
        when(transactions.findByUserIdAndDateBetweenOrderByDateDesc(eq(10L), any(), any())).thenReturn(List.of());

        InvestmentSuggestionsResponse result = service.getSuggestions(10L);

        assertEquals("0.00", result.getIncome().toPlainString());
        assertEquals("0.00", result.getExpenses().toPlainString());
        assertNull(result.getSavingsRatePercentage());
        assertEquals("NO_DATA", result.getCashFlowStatus());
        assertEquals("record-finances", result.getSuggestions().get(0).code());
        verifyNoInteractions(explanations);
    }

    @Test
    void rejectsExplanationsContainingFiguresOrSpecificProducts() {
        YearMonth month = YearMonth.now();
        when(transactions.findByUserIdAndDateBetweenOrderByDateDesc(eq(10L), any(), any()))
                .thenReturn(List.of(tx(10L, "income", "100.00", month.atDay(1).atStartOfDay())));
        when(explanations.answer(anyString(), any())).thenReturn(SystemCResponse.builder()
                .answer("Put 20% into a stock fund for a return.").build());

        InvestmentSuggestionsResponse result = service.getSuggestions(10L);

        assertFalse(result.isAiGenerated());
        assertEquals("These educational prompts are based on your recorded current-month cash flow.", result.getExplanation());
        assertEquals("100.00", result.getIncome().toPlainString());
    }

    @Test
    void rejectsSpelledOutFiguresAndGuaranteedReturnClaims() {
        YearMonth month = YearMonth.now();
        when(transactions.findByUserIdAndDateBetweenOrderByDateDesc(eq(10L), any(), any()))
                .thenReturn(List.of(tx(10L, "income", "100.00", month.atDay(1).atStartOfDay())));
        when(explanations.answer(anyString(), any())).thenReturn(SystemCResponse.builder()
                .answer("One guaranteed return can protect your savings.").build());

        InvestmentSuggestionsResponse result = service.getSuggestions(10L);

        assertFalse(result.isAiGenerated());
        assertEquals("These educational prompts are based on your recorded current-month cash flow.", result.getExplanation());
    }

    private static Transaction tx(Long userId, String type, String amount, LocalDateTime date) {
        return Transaction.builder().userId(userId).type(type).amount(new BigDecimal(amount)).date(date).build();
    }
}
