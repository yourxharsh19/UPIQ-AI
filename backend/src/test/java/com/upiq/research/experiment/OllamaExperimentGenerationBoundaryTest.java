package com.upiq.research.experiment;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.upiq.research.context.FinancialContext;
import com.upiq.research.context.FinancialFacts;
import com.upiq.research.dataset.dto.BenchmarkQuestionDefinition;
import com.upiq.research.dataset.dto.ResearchProfileDefinition;
import com.upiq.research.dataset.dto.ResearchTransactionDefinition;
import com.upiq.research.llm.GroundedFinancialPromptBuilder;
import com.upiq.research.llm.OllamaClient;
import com.upiq.research.llm.OllamaClientException;
import com.upiq.research.llm.OllamaGenerateResponse;
import com.upiq.research.llm.OllamaProperties;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

class OllamaExperimentGenerationBoundaryTest {
    private final OllamaClient client = mock(OllamaClient.class);
    private final OllamaProperties properties = new OllamaProperties();
    private final ObjectMapper mapper = new ObjectMapper().findAndRegisterModules();
    private final OllamaExperimentGenerationBoundary boundary = new OllamaExperimentGenerationBoundary(
            client, properties, List.of(new SystemAPromptAdapter(), new SystemBPromptAdapter(mapper),
                    new SystemCPromptAdapter(new GroundedFinancialPromptBuilder(mapper))));

    @Test
    void routesAEachThroughTheSameBoundaryClientAndSharedModelConfiguration() {
        properties.setModel("shared-model:tag");
        when(client.generate(anyString())).thenReturn(OllamaGenerateResponse.builder()
                .response("Shared generation response").done(true).build());
        ExperimentCase experimentCase = sampleCase();

        SystemResult resultA = boundary.generate(SystemInput.forCase(ExperimentSystemId.A, experimentCase));
        SystemResult resultB = boundary.generate(SystemInput.forCase(ExperimentSystemId.B, experimentCase));
        SystemResult resultC = boundary.generate(SystemInput.forCase(ExperimentSystemId.C, experimentCase));

        assertEquals(List.of(ExperimentSystemId.A, ExperimentSystemId.B, ExperimentSystemId.C),
                List.of(resultA.systemId(), resultB.systemId(), resultC.systemId()));
        assertTrue(List.of(resultA, resultB, resultC).stream().allMatch(SystemResult::succeeded));
        assertTrue(List.of(resultA, resultB, resultC).stream()
                .allMatch(result -> "shared-model:tag".equals(result.model())));
        assertTrue(List.of(resultA, resultB, resultC).stream().allMatch(result -> result.latencyMs() >= 0));
        org.mockito.ArgumentCaptor<String> prompts = org.mockito.ArgumentCaptor.forClass(String.class);
        verify(client, times(3)).generate(prompts.capture());
        assertTrue(prompts.getAllValues().stream()
                .noneMatch(prompt -> prompt.contains("Answer in 2-4 short sentences")));
        assertTrue(prompts.getAllValues().get(2).contains("VERIFIED FINANCIAL FACTS"));
    }

    @Test
    void preservesModelLatencyAndAvailableOllamaMetadata() {
        when(client.generate(anyString())).thenReturn(OllamaGenerateResponse.builder()
                .model("llama3.1:8b").response("The supplied answer is 40.00.")
                .promptEvalCount(24).evalCount(9).totalDurationNs(1_300_000_000L).build());

        SystemResult result = boundary.generate(SystemInput.forCase(ExperimentSystemId.C, sampleCase()));

        assertEquals("llama3.1:8b", result.model());
        assertEquals("The supplied answer is 40.00.", result.answer());
        assertTrue(result.latencyMs() >= 0);
        assertEquals(24, result.promptEvalCount());
        assertEquals(9, result.evalCount());
        assertEquals(1_300_000_000L, result.ollamaTotalDurationNs());
    }

    @Test
    void mapsEveryTypedOllamaFailureToSystemResultWithoutAnAnswer() {
        for (OllamaClientException.Kind kind : OllamaClientException.Kind.values()) {
            reset(client);
            when(client.generate(anyString())).thenThrow(new OllamaClientException(kind, "safe failure\nmessage"));

            SystemResult result = boundary.generate(SystemInput.forCase(ExperimentSystemId.B, sampleCase()));

            assertFalse(result.succeeded());
            assertNull(result.answer());
            ExperimentErrorCode expectedCode = kind == OllamaClientException.Kind.CLIENT_ERROR
                    ? ExperimentErrorCode.GENERATION_ERROR
                    : ExperimentErrorCode.valueOf(kind.name());
            assertEquals(expectedCode, result.error().code(), "unexpected category for " + kind);
            assertEquals("safe failure message", result.error().message());
        }
    }

    private ExperimentCase sampleCase() {
        BenchmarkQuestionDefinition benchmark = BenchmarkQuestionDefinition.builder()
                .id("Q_TEST").text("What was my total Food expense?")
                .calculationType("CATEGORY_EXPENSE_TOTAL").profileId("profile_test").build();
        ResearchProfileDefinition profile = ResearchProfileDefinition.builder()
                .id("profile_test").username("case-user").build();
        ResearchTransactionDefinition transaction = ResearchTransactionDefinition.builder()
                .id("tx_test").profileId("profile_test").amount(40.00).type("expense")
                .category("Food").description("Groceries").paymentMethod("UPI")
                .date(LocalDateTime.of(2026, 8, 3, 12, 0)).build();
        FinancialContext financialContext = FinancialContext.builder().contextVersion("1.0")
                .source(FinancialContext.SOURCE).verified(true).calculationType("CATEGORY_EXPENSE_TOTAL")
                .facts(FinancialFacts.builder().category("Food")
                        .totalExpense(new BigDecimal("40.00")).transactionCount(1L).build()).build();
        return new ExperimentCase("Q_TEST", benchmark.getText(), benchmark, profile,
                List.of(transaction), financialContext);
    }
}
