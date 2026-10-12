package com.upiq.research.experiment;

import com.upiq.research.llm.OllamaClient;
import com.upiq.research.llm.OllamaClientException;
import com.upiq.research.llm.OllamaGenerateResponse;
import com.upiq.research.llm.OllamaProperties;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

/** One configured Ollama client and one generation path shared by all experiment conditions. */
@Component
public class OllamaExperimentGenerationBoundary implements ExperimentGenerationBoundary {
    private final OllamaClient ollamaClient;
    private final OllamaProperties properties;
    private final Map<ExperimentSystemId, SystemPromptAdapter> promptAdapters;

    public OllamaExperimentGenerationBoundary(
            OllamaClient ollamaClient,
            OllamaProperties properties,
            List<SystemPromptAdapter> adapters) {
        this.ollamaClient = ollamaClient;
        this.properties = properties;
        EnumMap<ExperimentSystemId, SystemPromptAdapter> bySystem = new EnumMap<>(ExperimentSystemId.class);
        for (SystemPromptAdapter adapter : adapters) {
            if (bySystem.put(adapter.systemId(), adapter) != null) {
                throw new IllegalArgumentException("Multiple prompt adapters configured for system " + adapter.systemId());
            }
        }
        this.promptAdapters = Map.copyOf(bySystem);
    }

    @Override
    public SystemResult generate(SystemInput input) {
        if (input == null) throw new IllegalArgumentException("system input is required");
        long start = System.nanoTime();
        try {
            SystemPromptAdapter adapter = promptAdapters.get(input.systemId());
            if (adapter == null) {
                return failure(input.systemId(), start, ExperimentErrorCode.GENERATION_ERROR,
                        "No prompt adapter is configured for system " + input.systemId());
            }
            String prompt = adapter.buildPrompt(input);
            OllamaGenerateResponse response = ollamaClient.generate(prompt);
            long latencyMs = elapsedMillis(start);
            String model = response.getModel() == null || response.getModel().isBlank()
                    ? properties.getModel() : response.getModel();
            return SystemResult.success(input.systemId(), response.getResponse(), model, latencyMs,
                    response.getPromptEvalCount(), response.getEvalCount(), response.getTotalDurationNs());
        } catch (OllamaClientException ex) {
            ExperimentErrorCode errorCode = ex.getKind() == OllamaClientException.Kind.CLIENT_ERROR
                    ? ExperimentErrorCode.GENERATION_ERROR
                    : ExperimentErrorCode.valueOf(ex.getKind().name());
            return failure(input.systemId(), start, errorCode,
                    safeMessage(ex.getMessage(), "Ollama generation failed"));
        } catch (RuntimeException ex) {
            return failure(input.systemId(), start, ExperimentErrorCode.GENERATION_ERROR,
                    "Experiment prompt preparation or generation failed");
        }
    }

    private static SystemResult failure(
            ExperimentSystemId systemId, long start, ExperimentErrorCode code, String message) {
        return SystemResult.failure(systemId, null, elapsedMillis(start), new ExperimentError(code, message));
    }

    private static long elapsedMillis(long start) {
        return (System.nanoTime() - start) / 1_000_000;
    }

    private static String safeMessage(String message, String fallback) {
        if (message == null || message.isBlank()) return fallback;
        String normalized = message.replaceAll("[\\r\\n\\t\\p{Cntrl}]", " ").trim();
        if (normalized.isBlank()) return fallback;
        return normalized.length() > 300 ? normalized.substring(0, 300) : normalized;
    }
}
