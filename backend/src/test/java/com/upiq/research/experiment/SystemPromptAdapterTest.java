package com.upiq.research.experiment;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.upiq.research.context.FinancialContext;
import com.upiq.research.context.FinancialFacts;
import com.upiq.research.dataset.dto.BenchmarkQuestionDefinition;
import com.upiq.research.dataset.dto.ResearchProfileDefinition;
import com.upiq.research.dataset.dto.ResearchTransactionDefinition;
import com.upiq.research.llm.GroundedFinancialPromptBuilder;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class SystemPromptAdapterTest {
    private final ObjectMapper mapper = new ObjectMapper().findAndRegisterModules();
    private final SystemAPromptAdapter systemA = new SystemAPromptAdapter();
    private final SystemBPromptAdapter systemB = new SystemBPromptAdapter(mapper);
    private final SystemCPromptAdapter systemC = new SystemCPromptAdapter(new GroundedFinancialPromptBuilder(mapper));

    @Test
    void systemAReceivesOnlyTheQuestionAndNoBenchmarkReferenceOrContext() {
        SystemInput input = SystemInput.forCase(ExperimentSystemId.A, sampleCase());

        String prompt = systemA.buildPrompt(input);

        assertEquals("USER QUESTION\nWhat was my total Food expense?", prompt);
        assertFalse(prompt.contains("RAW TRANSACTION"));
        assertFalse(prompt.contains("VERIFIED FINANCIAL FACTS"));
        assertFalse(prompt.contains("Groceries"));
        assertFalse(prompt.contains("987654"));
    }

    @Test
    void systemBLabelsAndSerializesOnlyItsAssignedRawTransactionContext() throws Exception {
        ExperimentCase experimentCase = sampleCase();
        SystemInput input = SystemInput.forCase(ExperimentSystemId.B, experimentCase);
        String prompt = systemB.buildPrompt(input);
        String rawJson = mapper.writeValueAsString(input.context());

        assertTrue(prompt.contains("USER QUESTION\n" + experimentCase.question()));
        assertTrue(prompt.contains("RAW TRANSACTION CONTEXT"));
        assertTrue(prompt.contains("raw user transaction context"));
        assertTrue(prompt.contains(rawJson));
        assertTrue(prompt.contains("Groceries"));
        assertFalse(prompt.contains("VERIFIED FINANCIAL FACTS"));
        assertFalse(prompt.contains("\"total_expense\":987654.00"));
    }

    @Test
    void systemCUsesExistingGroundedPromptAndDoesNotReceiveSeparateRawTransactions() throws Exception {
        ExperimentCase experimentCase = sampleCase();
        SystemInput input = SystemInput.forCase(ExperimentSystemId.C, experimentCase);

        String prompt = systemC.buildPrompt(input);

        assertTrue(prompt.contains("USER QUESTION\n" + experimentCase.question()));
        assertTrue(prompt.contains("VERIFIED FINANCIAL FACTS\n"
                + mapper.writeValueAsString(experimentCase.verifiedFinancialContext())));
        assertTrue(prompt.contains("Never assume or add a currency symbol, currency code, or currency"));
        assertTrue(prompt.contains("Do not claim to have inspected, reviewed, counted, analyzed, or calculated from raw transactions"));
        assertFalse(prompt.contains("Groceries"));
        assertFalse(prompt.contains("RAW TRANSACTION CONTEXT"));
    }

    private ExperimentCase sampleCase() {
        BenchmarkQuestionDefinition benchmark = BenchmarkQuestionDefinition.builder()
                .id("Q_TEST").text("What was my total Food expense?")
                .calculationType("CATEGORY_EXPENSE_TOTAL").profileId("profile_test")
                .category("Food").transactionType("expense").build();
        ResearchProfileDefinition profile = ResearchProfileDefinition.builder()
                .id("profile_test").username("case-user").email("case@example.test").build();
        ResearchTransactionDefinition transaction = ResearchTransactionDefinition.builder()
                .id("tx_test").profileId("profile_test").amount(new java.math.BigDecimal("12.50")).type("expense")
                .category("Food").description("Groceries").paymentMethod("UPI")
                .date(LocalDateTime.of(2026, 8, 3, 12, 0)).build();
        FinancialContext financialContext = FinancialContext.builder().contextVersion("1.0")
                .source(FinancialContext.SOURCE).verified(true).calculationType("CATEGORY_EXPENSE_TOTAL")
                .facts(FinancialFacts.builder().category("Food")
                        .totalExpense(new BigDecimal("987654.00")).transactionCount(99L).build()).build();
        return new ExperimentCase("Q_TEST", benchmark.getText(), benchmark, profile,
                List.of(transaction), financialContext);
    }
}
