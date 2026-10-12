package com.upiq.financial.chat;

import com.upiq.research.intent.FinancialIntentMapper;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.YearMonth;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class FinancialChatIntentResolverTest {

    private final FinancialChatIntentResolver resolver = new FinancialChatIntentResolver();
    private final FinancialIntentMapper mapper = new FinancialIntentMapper();
    private final YearMonth latestMonth = YearMonth.of(2026, 8);

    @Test
    void mapsSupportedQuestionFamiliesToTypedExecutableIntents() {
        assertType("What was my total income?", "TOTAL_INCOME");
        assertType("How much did I spend this month?", "TOTAL_EXPENSE");
        assertType("How much did I spend on Food?", "CATEGORY_EXPENSE_TOTAL");
        assertType("Compare my expenses with last month", "PERIOD_EXPENSE_COMPARE");
        assertType("Compare Food and Transport", "CATEGORY_COMPARE");
        assertType("What is my net balance?", "NET_BALANCE");
        assertType("Show my spending trend", "SPENDING_TREND");
        assertType("What was my largest expense?", "LARGEST_TRANSACTION");
    }

    @Test
    void mapsMonthComparisonInChronologicalOrder() {
        var question = resolver.resolve("Did I spend more in August than July?", latestMonth, LocalDate.of(2026, 1, 5))
                .orElseThrow();
        var intent = mapper.map(question, 19L);

        assertEquals("PERIOD_EXPENSE_COMPARE", intent.getCalculationType().name());
        assertEquals(LocalDate.of(2026, 7, 1), intent.getComparisonPeriod().getStartDate().toLocalDate());
        assertEquals(LocalDate.of(2026, 8, 1), intent.getPeriod().getStartDate().toLocalDate());
    }

    @Test
    void categoryComparisonPreservesQuestionOrderAndMapsThroughExistingMapper() {
        var question = resolver.resolve("Compare Food vs Transport", latestMonth, null).orElseThrow();
        var intent = mapper.map(question, 19L);

        assertEquals("Food", intent.getCategory());
        assertEquals("Transport", intent.getComparisonCategory());
    }

    @Test
    void unsupportedQuestionDoesNotProduceAnIntent() {
        assertTrue(resolver.resolve("Should I buy a new phone?", latestMonth, null).isEmpty());
        assertTrue(resolver.resolve("Should I spend more on travel?", latestMonth, null).isEmpty());
    }

    @Test
    void explicitMonthUsesCalendarYearInsteadOfLatestTransactionMonth() {
        var october = resolver.resolve("How much did I spend in October?", YearMonth.of(2026, 9),
                LocalDate.of(2026, 7, 1), YearMonth.of(2026, 10)).orElseThrow();
        assertEquals("2026-10-01", october.getStartDate());
        assertEquals("2026-10-31", october.getEndDate());
        var latestDefault = resolver.resolve("How much did I spend this month?", YearMonth.of(2026, 9),
                LocalDate.of(2026, 7, 1), YearMonth.of(2026, 10)).orElseThrow();
        assertEquals("2026-09-01", latestDefault.getStartDate());
    }

    @Test
    void onlyClearlyGeneralEducationalFinanceQuestionsUseGeneralKnowledgeRoute() {
        assertTrue(resolver.isGeneralEducationalQuestion("What is compound interest?"));
        assertTrue(resolver.isGeneralEducationalQuestion("Explain how a budget works"));
        assertTrue(resolver.isGeneralEducationalQuestion("How do credit cards work?"));
        assertTrue(resolver.isGeneralEducationalQuestion(
                "What is the difference between a savings account and a fixed deposit?"));
        assertTrue(resolver.isGeneralEducationalQuestion("Explain the difference between fixed deposits and savings accounts"));
        assertTrue(!resolver.isGeneralEducationalQuestion("What is my budget?"));
        assertTrue(!resolver.isGeneralEducationalQuestion("What was my total expense?"));
    }

    @Test
    void recognizesLatestMonthSummariesExplicitMonthAnalysisAndLatestMonthLargestExpense() {
        LocalDate earliest = LocalDate.of(2026, 1, 4);
        var summary = resolver.resolve("Summarize my spending for my latest available transaction month.",
                YearMonth.of(2026, 9), earliest, YearMonth.of(2026, 10)).orElseThrow();
        assertEquals("NET_BALANCE", summary.getCalculationType());
        assertEquals("2026-09-01", summary.getStartDate());
        assertEquals("2026-09-30", summary.getEndDate());

        var analysis = resolver.resolve("Analyze my October 2026 spending.", YearMonth.of(2026, 9),
                earliest, YearMonth.of(2026, 10)).orElseThrow();
        assertEquals("TOTAL_EXPENSE", analysis.getCalculationType());
        assertEquals("2026-10-01", analysis.getStartDate());
        assertEquals("2026-10-31", analysis.getEndDate());

        var largest = resolver.resolve("What was my largest expense in my latest available transaction month?",
                YearMonth.of(2026, 9), earliest, YearMonth.of(2026, 10)).orElseThrow();
        assertEquals("LARGEST_TRANSACTION", largest.getCalculationType());
        assertEquals("expense", largest.getTransactionType());
        assertEquals(1, largest.getLimit());
        assertEquals("2026-09-01", largest.getStartDate());
        assertEquals("2026-09-30", largest.getEndDate());
    }

    private void assertType(String text, String calculationType) {
        var question = resolver.resolve(text, latestMonth, LocalDate.of(2026, 1, 5)).orElseThrow();
        assertEquals(calculationType, mapper.map(question, 19L).getCalculationType().name());
    }
}
