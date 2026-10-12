package com.upiq.research.llm;

import com.upiq.research.context.FinancialContext;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class SystemCServiceTest {
    private final OllamaClient client = mock(OllamaClient.class);
    private final OllamaProperties properties = new OllamaProperties();
    private final SystemCService service = new SystemCService(
            new GroundedFinancialPromptBuilder(new ObjectMapper()), client);

    @Test
    void convertsSuccessPreservesMetadataAndRecordsLatency() {
        properties.setModel("configured-model");
        when(client.properties()).thenReturn(properties);
        when(client.generate(anyString())).thenReturn(OllamaGenerateResponse.builder()
                .model("llama3.2:latest").response("Verified explanation")
                .promptEvalCount(20).evalCount(8).totalDurationNs(99L).done(true).build());

        SystemCResponse result = service.answer("Explain", FinancialContext.builder().verified(true).build());

        assertEquals("Verified explanation", result.getAnswer());
        assertEquals("llama3.2:latest", result.getModel());
        assertTrue(result.getLatencyMs() >= 0);
        assertEquals(20, result.getPromptEvalCount());
        assertEquals(8, result.getEvalCount());
        assertEquals(99L, result.getOllamaTotalDurationNs());

        org.mockito.ArgumentCaptor<String> prompt = org.mockito.ArgumentCaptor.forClass(String.class);
        verify(client).generate(prompt.capture());
        assertTrue(prompt.getValue().contains("VERIFIED FINANCIAL FACTS"));
        assertFalse(prompt.getValue().contains("Answer in 2-4 short sentences"));
    }

    @Test
    void configuredModelIsUsedWhenOllamaOmitsModel() {
        properties.setModel("configured-model");
        when(client.properties()).thenReturn(properties);
        when(client.generate(anyString())).thenReturn(OllamaGenerateResponse.builder().response("Answer").build());
        assertEquals("configured-model", service.answer("Explain", FinancialContext.builder().verified(true).build()).getModel());
    }

    @Test
    void generalEducationPromptUsesRealOllamaAndDisclaimsPersonalLedgerAccess() {
        properties.setModel("llama3.1:8b");
        when(client.properties()).thenReturn(properties);
        when(client.generate(anyString())).thenReturn(OllamaGenerateResponse.builder()
                .model("llama3.1:8b").response("Compound interest includes accumulated interest.").build());

        service.answerGeneral("What is compound interest?");

        org.mockito.ArgumentCaptor<String> prompt = org.mockito.ArgumentCaptor.forClass(String.class);
        verify(client).generate(prompt.capture());
        assertTrue(prompt.getValue().contains("What is compound interest?"));
        assertTrue(prompt.getValue().contains("No personal transaction ledger or account data was supplied"));
        assertTrue(prompt.getValue().contains("Do not claim to know the user's finances"));
        assertTrue(prompt.getValue().contains("Answer in 2-4 short sentences"));
        assertTrue(prompt.getValue().contains("Include every essential part of any named rule or framework"));
        assertTrue(prompt.getValue().contains("finish with a complete final sentence"));
    }

    @Test
    void propagatesExplicitOllamaFailuresWithoutCreatingAnswer() {
        for (OllamaClientException.Kind kind : new OllamaClientException.Kind[]{
                OllamaClientException.Kind.UNAVAILABLE, OllamaClientException.Kind.HTTP_ERROR,
                OllamaClientException.Kind.MALFORMED_RESPONSE, OllamaClientException.Kind.EMPTY_RESPONSE}) {
            reset(client);
            when(client.generate(anyString())).thenThrow(new OllamaClientException(kind, "Ollama failure"));
            OllamaClientException error = assertThrows(OllamaClientException.class,
                    () -> service.answer("Explain", FinancialContext.builder().verified(true).build()));
            assertEquals(kind, error.getKind());
        }
    }
}
