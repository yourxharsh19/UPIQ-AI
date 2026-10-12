package com.upiq.financial.chat;

import com.upiq.research.context.FinancialContext;
import com.upiq.research.context.FinancialContextBuilder;
import com.upiq.research.context.FinancialFacts;
import com.upiq.research.intent.CalculationType;
import com.upiq.research.intent.DispatchedCalculation;
import com.upiq.research.intent.FinancialIntentDispatcher;
import com.upiq.research.intent.FinancialQueryIntent;
import com.upiq.research.llm.OllamaClientException;
import com.upiq.research.llm.SystemCResponse;
import com.upiq.research.llm.SystemCService;
import com.upiq.transaction.model.Transaction;
import com.upiq.transaction.repository.TransactionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FinancialChatServiceTest {

    @Mock private TransactionRepository transactions;
    @Spy private FinancialChatIntentResolver intentResolver = new FinancialChatIntentResolver();
    @Mock private FinancialIntentDispatcher dispatcher;
    @Mock private FinancialContextBuilder contextBuilder;
    @Mock private SystemCService systemC;
    @InjectMocks private FinancialChatService service;

    @Test
    void supportedQuestionUsesAuthenticatedIdDeterministicDispatchAndVerifiedContext() {
        Long userId = 72L;
        mockUserDates(userId);
        FinancialQueryIntent intent = FinancialQueryIntent.builder()
                .calculationType(CalculationType.TOTAL_EXPENSE).userId(userId).build();
        DispatchedCalculation dispatched = new DispatchedCalculation(intent, new BigDecimal("3620.00"));
        FinancialContext context = verifiedExpenseContext();
        when(dispatcher.dispatch(any(com.upiq.research.dataset.dto.BenchmarkQuestionDefinition.class), eq(userId)))
                .thenReturn(dispatched);
        when(contextBuilder.build(dispatched)).thenReturn(context);
        when(systemC.answer("How much did I spend this month?", context))
                .thenReturn(SystemCResponse.builder().answer("Verified expenses were 3620.")
                        .model("llama3.1:8b").latencyMs(45).build());

        FinancialChatResponse response = service.answer("How much did I spend this month?", userId);

        assertTrue(response.isSupported());
        assertFalse(response.isError());
        assertEquals("TOTAL_EXPENSE", response.getCalculationType());
        assertSame(context, response.getFinancialContext());
        assertEquals("llama3.1:8b", response.getModel());
        assertEquals(45L, response.getLatencyMs());
        verify(dispatcher).dispatch(any(com.upiq.research.dataset.dto.BenchmarkQuestionDefinition.class), eq(userId));
        verify(systemC).answer("How much did I spend this month?", context);
        assertEquals(new BigDecimal("3620.00"), context.getFacts().getTotalExpense());
        assertEquals(null, context.getFacts().getDescription());
        assertFalse(new FinancialContextBuilder().toJson(context).contains("\"transactions\""));
    }

    @Test
    void unsupportedQuestionStopsBeforeCalculationAndModel() {
        mockUserDates(72L);

        FinancialChatResponse response = service.answer("Should I buy a new phone?", 72L);

        assertFalse(response.isSupported());
        assertFalse(response.isError());
        assertTrue(response.getAnswer().contains("category spending"));
        verify(dispatcher, never()).dispatch(any(com.upiq.research.dataset.dto.BenchmarkQuestionDefinition.class), any());
        verify(systemC, never()).answer(any(), any());
    }

    @Test
    void ollamaFailureReturnsGracefulErrorAndRetainsVerifiedFacts() {
        Long userId = 72L;
        mockUserDates(userId);
        FinancialQueryIntent intent = FinancialQueryIntent.builder()
                .calculationType(CalculationType.TOTAL_EXPENSE).userId(userId).build();
        DispatchedCalculation dispatched = new DispatchedCalculation(intent, BigDecimal.ZERO);
        FinancialContext context = verifiedExpenseContext();
        when(dispatcher.dispatch(any(com.upiq.research.dataset.dto.BenchmarkQuestionDefinition.class), eq(userId)))
                .thenReturn(dispatched);
        when(contextBuilder.build(dispatched)).thenReturn(context);
        when(systemC.answer("How much did I spend?", context))
                .thenThrow(new OllamaClientException(OllamaClientException.Kind.UNAVAILABLE, "offline"));

        FinancialChatResponse response = service.answer("How much did I spend?", userId);

        assertTrue(response.isSupported());
        assertTrue(response.isError());
        assertSame(context, response.getFinancialContext());
        assertTrue(response.getAnswer().contains("AI service"));
    }

    @Test
    void noTransactionsProducesHelpfulResponseWithoutCallingTheModel() {
        when(transactions.findTopByUserIdOrderByDateDesc(72L)).thenReturn(Optional.empty());

        FinancialChatResponse response = service.answer("What was my total income?", 72L);

        assertTrue(response.isSupported());
        assertFalse(response.isError());
        assertTrue(response.getAnswer().contains("No transaction data"));
        verify(systemC, never()).answer(any(), any());
    }

    @Test
    void generalEducationalQuestionUsesRealModelEvenWithNoTransactions() {
        when(systemC.answerGeneral("What is compound interest?"))
                .thenReturn(SystemCResponse.builder().answer("Interest on principal and accumulated interest.")
                        .model("llama3.1:8b").latencyMs(31).build());

        FinancialChatResponse response = service.answer("What is compound interest?", 72L);

        assertTrue(response.isSupported());
        assertFalse(response.isError());
        assertEquals("llama3.1:8b", response.getModel());
        assertTrue(response.getAnswer().contains("accumulated interest"));
        verify(systemC).answerGeneral("What is compound interest?");
    }

    @Test
    void savingsAccountVersusFixedDepositQuestionUsesGeneralEducationRoute() {
        String question = "What is the difference between a savings account and a fixed deposit?";
        when(systemC.answerGeneral(question)).thenReturn(SystemCResponse.builder()
                .answer("A savings account offers liquidity; a fixed deposit locks funds for a term.")
                .model("llama3.1:8b").latencyMs(31).build());

        FinancialChatResponse response = service.answer(question, 72L);

        assertTrue(response.isSupported());
        assertFalse(response.isError());
        verify(systemC).answerGeneral(question);
        verify(transactions, never()).findTopByUserIdOrderByDateDesc(72L);
    }

    @Test
    void latestAvailableMonthSummaryUsesAuthenticatedLedgerAndVerifiedNetBalanceFacts() {
        Long userId = 72L;
        mockUserDates(userId);
        String question = "Summarize my spending for my latest available transaction month.";
        FinancialQueryIntent intent = FinancialQueryIntent.builder()
                .calculationType(CalculationType.NET_BALANCE).userId(userId).build();
        DispatchedCalculation dispatched = new DispatchedCalculation(intent, new BigDecimal("100.00"));
        FinancialContext context = FinancialContext.builder().contextVersion("1.0").source(FinancialContext.SOURCE)
                .verified(true).calculationType("NET_BALANCE")
                .facts(FinancialFacts.builder().totalIncome(new BigDecimal("5000.00"))
                        .totalExpense(new BigDecimal("4900.00")).netBalance(new BigDecimal("100.00")).build())
                .build();
        when(dispatcher.dispatch(any(com.upiq.research.dataset.dto.BenchmarkQuestionDefinition.class), eq(userId)))
                .thenReturn(dispatched);
        when(contextBuilder.build(dispatched)).thenReturn(context);
        when(systemC.answer(question, context)).thenReturn(SystemCResponse.builder()
                .answer("Income 5000.00, expenses 4900.00, net cash flow 100.00.").build());

        FinancialChatResponse response = service.answer(question, userId);

        var definition = org.mockito.ArgumentCaptor.forClass(
                com.upiq.research.dataset.dto.BenchmarkQuestionDefinition.class);
        verify(dispatcher).dispatch(definition.capture(), eq(userId));
        assertEquals("NET_BALANCE", definition.getValue().getCalculationType());
        assertEquals("2026-08-01", definition.getValue().getStartDate());
        assertEquals("2026-08-31", definition.getValue().getEndDate());
        assertTrue(response.isSupported());
        assertFalse(response.isError());
        assertSame(context, response.getFinancialContext());
        verify(systemC).answer(question, context);
    }

    @Test
    void generalQuestionProviderFailureIsReportedAsAiErrorNotMissingData() {
        when(systemC.answerGeneral("What is inflation?"))
                .thenThrow(new OllamaClientException(OllamaClientException.Kind.UNAVAILABLE, "offline"));

        FinancialChatResponse response = service.answer("What is inflation?", 72L);

        assertTrue(response.isSupported());
        assertTrue(response.isError());
        assertTrue(response.getAnswer().contains("AI service"));
        assertFalse(response.getAnswer().contains("verified calculation"));
        verify(systemC).answerGeneral("What is inflation?");
    }

    @Test
    void supportedFinancialQuestionUsesAnExplicitHistoricalMonthFromTheUsersLedger() {
        Long userId = 72L;
        when(transactions.findTopByUserIdOrderByDateDesc(userId)).thenReturn(Optional.of(Transaction.builder()
                .userId(userId).date(LocalDateTime.of(2026, 9, 28, 10, 0)).build()));
        when(transactions.findTopByUserIdOrderByDateAsc(userId)).thenReturn(Optional.of(Transaction.builder()
                .userId(userId).date(LocalDateTime.of(2026, 7, 1, 10, 0)).build()));
        when(transactions.findByUserIdAndDateBetweenOrderByDateDesc(eq(userId), any(), any()))
                .thenReturn(java.util.List.of(Transaction.builder().userId(userId).type("expense")
                        .date(LocalDateTime.of(2026, 7, 12, 10, 0)).build()));
        FinancialQueryIntent intent = FinancialQueryIntent.builder()
                .calculationType(CalculationType.TOTAL_EXPENSE).userId(userId).build();
        DispatchedCalculation dispatched = new DispatchedCalculation(intent, new BigDecimal("42.00"));
        FinancialContext context = verifiedExpenseContext();
        when(dispatcher.dispatch(any(com.upiq.research.dataset.dto.BenchmarkQuestionDefinition.class), eq(userId)))
                .thenReturn(dispatched);
        when(contextBuilder.build(dispatched)).thenReturn(context);
        when(systemC.answer("How much did I spend in July 2026?", context))
                .thenReturn(SystemCResponse.builder().answer("Verified total: 42.00").build());

        FinancialChatResponse response = service.answer("How much did I spend in July 2026?", userId);

        var question = org.mockito.ArgumentCaptor.forClass(com.upiq.research.dataset.dto.BenchmarkQuestionDefinition.class);
        verify(dispatcher).dispatch(question.capture(), eq(userId));
        assertEquals("2026-07-01", question.getValue().getStartDate());
        assertTrue(response.isSupported());
        assertFalse(response.isError());
    }

    @Test
    void explicitlyRequestedEmptyCalendarMonthIsNotReplacedWithLatestDataMonth() {
        Long userId = 72L;
        when(transactions.findTopByUserIdOrderByDateDesc(userId)).thenReturn(Optional.of(Transaction.builder()
                .userId(userId).date(LocalDateTime.of(2026, 9, 28, 10, 0)).build()));
        when(transactions.findTopByUserIdOrderByDateAsc(userId)).thenReturn(Optional.of(Transaction.builder()
                .userId(userId).date(LocalDateTime.of(2026, 7, 1, 10, 0)).build()));
        when(transactions.findByUserIdAndDateBetweenOrderByDateDesc(eq(userId), any(), any())).thenReturn(java.util.List.of());

        FinancialChatResponse response = service.answer("Analyze my October 2026 spending.", userId);

        assertTrue(response.isSupported());
        assertFalse(response.isError());
        assertTrue(response.getAnswer().contains("October 2026"));
        assertTrue(response.getAnswer().contains("September 2026"));
        verify(systemC, never()).answer(any(), any());
    }

    private void mockUserDates(Long userId) {
        when(transactions.findTopByUserIdOrderByDateDesc(userId)).thenReturn(Optional.of(Transaction.builder()
                .userId(userId).date(LocalDateTime.of(2026, 8, 12, 10, 0)).build()));
        when(transactions.findTopByUserIdOrderByDateAsc(userId)).thenReturn(Optional.of(Transaction.builder()
                .userId(userId).date(LocalDateTime.of(2026, 1, 4, 10, 0)).build()));
        lenient().when(transactions.findByUserIdAndDateBetweenOrderByDateDesc(eq(userId), any(), any()))
                .thenReturn(java.util.List.of(Transaction.builder().userId(userId).type("expense")
                        .date(LocalDateTime.of(2026, 8, 12, 10, 0)).build()));
    }

    private FinancialContext verifiedExpenseContext() {
        return FinancialContext.builder().contextVersion("1.0").source(FinancialContext.SOURCE).verified(true)
                .calculationType("TOTAL_EXPENSE")
                .facts(FinancialFacts.builder().totalExpense(new BigDecimal("3620.00")).build()).build();
    }
}
