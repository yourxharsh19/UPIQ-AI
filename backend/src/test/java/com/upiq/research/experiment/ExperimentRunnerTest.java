package com.upiq.research.experiment;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.upiq.research.context.FinancialContext;
import com.upiq.research.context.FinancialFacts;
import com.upiq.research.dataset.dto.BenchmarkQuestionDefinition;
import com.upiq.research.dataset.dto.ResearchProfileDefinition;
import com.upiq.research.dataset.dto.ResearchTransactionDefinition;
import com.upiq.research.llm.OllamaProperties;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class ExperimentRunnerTest {
    @TempDir
    Path tempDir;

    @Test
    void runsCasesInStableCaseAndSystemOrderAndCapturesRunMetadata() {
        List<SystemInput> calls = new ArrayList<>();
        ExperimentGenerationBoundary boundary = input -> {
            calls.add(input);
            return SystemResult.success(input.systemId(), "answer-" + input.systemId(), "model:tag",
                    25, 12, 4, 100L);
        };
        OllamaProperties properties = properties();

        ExperimentRun run = new ExperimentRunner(boundary, properties)
                .run(List.of(experimentCase("Q002", "second"), experimentCase("Q001", "first")));

        assertEquals(List.of("Q001", "Q002"), run.cases().stream().map(ExperimentCaseResult::caseId).toList());
        assertEquals(List.of(ExperimentSystemId.A, ExperimentSystemId.B, ExperimentSystemId.C,
                        ExperimentSystemId.A, ExperimentSystemId.B, ExperimentSystemId.C),
                calls.stream().map(SystemInput::systemId).toList());
        assertEquals(List.of("first", "first", "first", "second", "second", "second"),
                calls.stream().map(SystemInput::question).toList());
        assertEquals(List.of(ExperimentSystemId.A, ExperimentSystemId.B, ExperimentSystemId.C), run.systemsExecuted());
        assertEquals(2, run.numberOfCases());
        assertFalse(run.runId().isBlank());
        assertNotNull(run.timestamp());
        assertEquals("llama3.1:8b", run.model());
        assertEquals(0.0, run.temperature());
        assertEquals("http://localhost:11434", run.ollamaBaseUrl());
        assertEquals(Duration.ofSeconds(60), run.ollamaTimeout());
        assertNull(run.datasetVersion());
        assertEquals(ExperimentSystemId.A, run.cases().getFirst().systemResults().getFirst().systemId());
        assertEquals("answer-C", run.cases().getFirst().systemResults().getLast().answer());
    }

    @Test
    void recordsSystemFailureAndContinuesRemainingSystemsAndCases() {
        List<SystemInput> calls = new ArrayList<>();
        ExperimentGenerationBoundary boundary = input -> {
            calls.add(input);
            if (input.systemId() == ExperimentSystemId.B && input.question().equals("first")) {
                return SystemResult.failure(ExperimentSystemId.B, "llama3.1:8b", 500,
                        new ExperimentError(ExperimentErrorCode.TIMEOUT, "request timed out"));
            }
            return SystemResult.success(input.systemId(), "answer", "llama3.1:8b", 10, null, null, null);
        };

        ExperimentRun run = new ExperimentRunner(boundary, properties())
                .run(List.of(experimentCase("Q001", "first"), experimentCase("Q002", "second")));

        assertEquals(6, calls.size());
        ExperimentSystemRunResult failure = run.cases().getFirst().systemResults().get(1);
        assertEquals(ExperimentSystemId.B, failure.systemId());
        assertFalse(failure.succeeded());
        assertNull(failure.answer());
        assertEquals(ExperimentErrorCode.TIMEOUT, failure.error().code());
        assertTrue(run.cases().getLast().systemResults().stream().allMatch(ExperimentSystemRunResult::succeeded));
    }

    @Test
    void keepsReferenceSeparateFromInputsAndWritesSerializableRunArtifact() throws Exception {
        List<SystemInput> calls = new ArrayList<>();
        ExperimentGenerationBoundary boundary = input -> {
            calls.add(input);
            return SystemResult.success(input.systemId(), "answer", "llama3.1:8b", 5, 12, 4, 900L);
        };
        ExperimentCase experimentCase = experimentCase("Q001", "question");
        ExperimentRunner runner = new ExperimentRunner(boundary, properties());
        ExperimentRun run = runner.run(List.of(experimentCase));

        ObjectMapper mapper = new ObjectMapper().findAndRegisterModules();
        String inputA = mapper.writeValueAsString(calls.get(0));
        String inputB = mapper.writeValueAsString(calls.get(1));
        String inputC = mapper.writeValueAsString(calls.get(2));
        assertFalse(inputA.contains("123456.00"));
        assertFalse(inputB.contains("123456.00"));
        assertFalse(inputA.contains("benchmarkReference"));
        assertFalse(inputB.contains("benchmarkReference"));
        assertTrue(inputC.contains("123456.00"), "System C receives the expected verified fact through its intended context");
        assertEquals(experimentCase.verifiedFinancialContext(), run.cases().getFirst().benchmarkReference());

        Path outputPath = tempDir.resolve("results").resolve("run.json");
        Path written = new ExperimentResultWriter(mapper).write(run, outputPath);
        String json = Files.readString(written);
        assertTrue(json.contains("\"runId\""));
        assertTrue(json.contains("\"timestamp\""));
        assertTrue(json.contains("\"benchmarkReference\""));
        assertTrue(json.contains("\"promptTokenCount\""));
        assertTrue(json.contains("\"systemId\""));
        assertTrue(json.contains("\"A\""));
        assertThrows(java.nio.file.FileAlreadyExistsException.class,
                () -> new ExperimentResultWriter(mapper).write(run, outputPath));
    }

    @Test
    void convertsUnexpectedBoundaryExceptionIntoRecordedFailureAndContinues() {
        ExperimentGenerationBoundary boundary = input -> {
            if (input.systemId() == ExperimentSystemId.A) throw new IllegalStateException("private transport detail");
            return SystemResult.success(input.systemId(), "answer", "llama3.1:8b", 2, null, null, null);
        };

        ExperimentRun run = new ExperimentRunner(boundary, properties()).run(List.of(experimentCase("Q001", "question")));

        ExperimentSystemRunResult failure = run.cases().getFirst().systemResults().getFirst();
        assertEquals(ExperimentErrorCode.GENERATION_ERROR, failure.error().code());
        assertEquals("Generation boundary failed unexpectedly", failure.error().message());
        assertEquals(3, run.cases().getFirst().systemResults().size());
        assertTrue(run.cases().getFirst().systemResults().get(1).succeeded());
    }

    @Test
    void rejectsEmptyAndDuplicateCaseCollections() {
        ExperimentRunner runner = new ExperimentRunner(input -> null, properties());
        assertThrows(IllegalArgumentException.class, () -> runner.run(List.of()));
        assertThrows(IllegalArgumentException.class, () -> runner.run(List.of(
                experimentCase("Q001", "one"), experimentCase("Q001", "two"))));
    }

    private static OllamaProperties properties() {
        OllamaProperties properties = new OllamaProperties();
        properties.setBaseUrl("http://localhost:11434");
        properties.setModel("llama3.1:8b");
        properties.setTemperature(0.0);
        properties.setTimeout(Duration.ofSeconds(60));
        return properties;
    }

    private static ExperimentCase experimentCase(String id, String question) {
        BenchmarkQuestionDefinition benchmark = BenchmarkQuestionDefinition.builder().id(id).text(question)
                .calculationType("CATEGORY_EXPENSE_TOTAL").profileId("profile_01").category("Food")
                .transactionType("expense").build();
        ResearchProfileDefinition profile = ResearchProfileDefinition.builder().id("profile_01")
                .username("synthetic-user").build();
        ResearchTransactionDefinition transaction = ResearchTransactionDefinition.builder().id("tx_" + id)
                .profileId("profile_01").amount(new java.math.BigDecimal("25.00")).type("expense").category("Food")
                .description("Groceries").build();
        FinancialContext verified = FinancialContext.builder().contextVersion("1.0").source(FinancialContext.SOURCE)
                .verified(true).calculationType("CATEGORY_EXPENSE_TOTAL")
                .facts(FinancialFacts.builder().category("Food").totalExpense(new BigDecimal("123456.00"))
                        .transactionCount(1L).build()).build();
        return new ExperimentCase(id, question, benchmark, profile, List.of(transaction), verified);
    }
}
