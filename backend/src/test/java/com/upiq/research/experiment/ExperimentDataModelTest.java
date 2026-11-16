package com.upiq.research.experiment;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.upiq.research.context.FinancialContext;
import com.upiq.research.context.FinancialFacts;
import com.upiq.research.dataset.dto.BenchmarkQuestionDefinition;
import com.upiq.research.dataset.dto.ResearchProfileDefinition;
import com.upiq.research.dataset.dto.ResearchTransactionDefinition;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class ExperimentDataModelTest {
    private final ObjectMapper mapper = new ObjectMapper().findAndRegisterModules();

    @Test
    void createsCaseByReusingBenchmarkProfileAndTransactionStructures() {
        ExperimentCase experimentCase = sampleCase();

        assertEquals("Q001", experimentCase.caseId());
        assertEquals("How much did I spend on Food?", experimentCase.question());
        assertEquals("CATEGORY_EXPENSE_TOTAL", experimentCase.benchmarkQuestion().getCalculationType());
        assertEquals("profile_01", experimentCase.profile().getId());
        assertEquals(1, experimentCase.relevantTransactions().size());
        assertEquals("Food", experimentCase.relevantTransactions().getFirst().getCategory());
        assertThrows(UnsupportedOperationException.class,
                () -> experimentCase.relevantTransactions().add(transaction()));
    }

    @Test
    void identifiesExactlyTheThreeExperimentalSystems() {
        assertArrayEquals(new ExperimentSystemId[]{ExperimentSystemId.A, ExperimentSystemId.B, ExperimentSystemId.C},
                ExperimentSystemId.values());
    }

    @Test
    void buildsAQuestionOnlyBQuestionAndRawTransactionsAndCQuestionAndVerifiedContext() {
        ExperimentCase experimentCase = sampleCase();
        SystemInput a = SystemInput.forCase(ExperimentSystemId.A, experimentCase);
        SystemInput b = SystemInput.forCase(ExperimentSystemId.B, experimentCase);
        SystemInput c = SystemInput.forCase(ExperimentSystemId.C, experimentCase);

        assertEquals(experimentCase.question(), a.question());
        assertNull(a.context());
        assertEquals(experimentCase.question(), b.question());
        assertInstanceOf(RawTransactionContext.class, b.context());
        RawTransactionContext raw = (RawTransactionContext) b.context();
        assertEquals(experimentCase.profile(), raw.profile());
        assertEquals(experimentCase.relevantTransactions(), raw.transactions());
        assertEquals(experimentCase.question(), c.question());
        assertInstanceOf(VerifiedFinancialContextPayload.class, c.context());
        assertEquals(experimentCase.verifiedFinancialContext(),
                ((VerifiedFinancialContextPayload) c.context()).financialContext());
    }

    @Test
    void systemInputEnforcesTheMatchingPayloadAndSerializesItsDiscriminator() throws Exception {
        ExperimentCase experimentCase = sampleCase();
        SystemInput input = SystemInput.forCase(ExperimentSystemId.B, experimentCase);
        String json = mapper.writeValueAsString(input);

        assertTrue(json.contains("\"systemId\":\"B\""));
        assertTrue(json.contains("\"context_type\":\"raw_transactions\""));
        assertTrue(json.contains("\"question\":\"How much did I spend on Food?\""));
        assertThrows(IllegalArgumentException.class,
                () -> new SystemInput(ExperimentSystemId.A, "Question", new RawTransactionContext(profile(), List.of())));
        assertThrows(IllegalArgumentException.class,
                () -> new SystemInput(ExperimentSystemId.B, "Question", null));
    }

    @Test
    void representsSuccessAndFailureWithOptionalMetadataAndSerializableError() throws Exception {
        SystemResult success = SystemResult.success(ExperimentSystemId.C, "The verified total is 40.00.",
                "llama3.1:8b", 1250, 50, 12, 1_200_000_000L);
        SystemResult failure = SystemResult.failure(ExperimentSystemId.B, "llama3.1:8b", 200,
                new ExperimentError(ExperimentErrorCode.TIMEOUT, "Ollama request timed out"));

        assertTrue(success.succeeded());
        assertEquals("llama3.1:8b", success.model());
        assertEquals(1250, success.latencyMs());
        assertEquals(50, success.promptEvalCount());
        assertEquals(12, success.evalCount());
        assertEquals(1_200_000_000L, success.ollamaTotalDurationNs());
        assertFalse(failure.succeeded());
        assertNull(failure.answer());
        assertEquals(ExperimentErrorCode.TIMEOUT, failure.error().code());
        assertTrue(mapper.writeValueAsString(failure).contains("\"code\":\"TIMEOUT\""));
        assertThrows(IllegalArgumentException.class, () -> SystemResult.success(
                ExperimentSystemId.A, "", "model", 0, null, null, null));
    }

    @Test
    void experimentSystemAndGenerationBoundaryShareTheSameInputAndResultContracts() {
        ExperimentCase experimentCase = sampleCase();
        ExperimentSystem systemA = () -> ExperimentSystemId.A;
        SystemInput input = systemA.createInput(experimentCase);
        ExperimentGenerationBoundary boundary = request -> SystemResult.success(
                request.systemId(), "Answer", "llama3.1:8b", 10, null, null, null);

        assertEquals(ExperimentSystemId.A, input.systemId());
        assertEquals(experimentCase.question(), input.question());
        assertEquals(ExperimentSystemId.A, boundary.generate(input).systemId());
    }

    private ExperimentCase sampleCase() {
        BenchmarkQuestionDefinition benchmark = BenchmarkQuestionDefinition.builder()
                .id("Q001").text("How much did I spend on Food?")
                .calculationType("CATEGORY_EXPENSE_TOTAL").profileId("profile_01")
                .category("Food").transactionType("expense").build();
        return new ExperimentCase("Q001", benchmark.getText(), benchmark, profile(), List.of(transaction()),
                FinancialContext.builder().contextVersion(FinancialContext.CONTEXT_VERSION)
                        .source(FinancialContext.SOURCE).verified(true)
                        .calculationType("CATEGORY_EXPENSE_TOTAL")
                        .facts(FinancialFacts.builder().category("Food")
                                .totalExpense(new BigDecimal("40.00")).transactionCount(1L).build()).build());
    }

    private static ResearchProfileDefinition profile() {
        return ResearchProfileDefinition.builder().id("profile_01").username("research-user").build();
    }

    private static ResearchTransactionDefinition transaction() {
        return ResearchTransactionDefinition.builder().id("tx_001").profileId("profile_01")
                .amount(new java.math.BigDecimal("40.00")).type("expense").category("Food").description("Groceries")
                .paymentMethod("UPI").date(LocalDateTime.of(2026, 8, 1, 12, 0)).recurring(false).build();
    }
}
