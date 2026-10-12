package com.upiq.research.llm;

import com.upiq.research.context.FinancialContext;
import org.springframework.stereotype.Service;

/** System C explanation flow; numerical answers remain owned by the deterministic engine. */
@Service
public class SystemCService {
    private final GroundedFinancialPromptBuilder promptBuilder;
    private final OllamaClient ollamaClient;

    public SystemCService(GroundedFinancialPromptBuilder promptBuilder, OllamaClient ollamaClient) {
        this.promptBuilder = promptBuilder;
        this.ollamaClient = ollamaClient;
    }

    public SystemCResponse answer(String question, FinancialContext context) {
        String prompt = promptBuilder.build(question, context);
        return generate(prompt);
    }

    /** General educational answers may use model knowledge, but never claim personal ledger access. */
    public SystemCResponse answerGeneral(String question) {
        if (question == null || question.isBlank()) throw new IllegalArgumentException("user question is required");
        String prompt = "GENERAL FINANCIAL EDUCATION QUESTION\n" + question + "\n\n"
                + "Answer as a general educational explanation only. No personal transaction ledger or account data "
                + "was supplied. Do not claim to know the user's finances, provide personalized financial advice, "
                + "or invent facts about the user's income, spending, balances, or transactions. If asked for a "
                + "personal calculation, say that transaction data is not available. Clearly identify general "
                + "explanations as general information. Answer in 2-4 short sentences unless the question requires "
                + "more detail. Include every essential part of any named rule or framework, avoid multi-item "
                + "example lists, and finish with a complete final sentence.\n";
        return generate(prompt);
    }

    private SystemCResponse generate(String prompt) {
        long start = System.nanoTime();
        OllamaGenerateResponse generated = ollamaClient.generate(prompt);
        long latencyMs = (System.nanoTime() - start) / 1_000_000;
        return SystemCResponse.builder()
                .answer(generated.getResponse())
                .model(generated.getModel() == null || generated.getModel().isBlank()
                        ? ollamaClient.properties().getModel() : generated.getModel())
                .latencyMs(latencyMs)
                .promptEvalCount(generated.getPromptEvalCount())
                .evalCount(generated.getEvalCount())
                .ollamaTotalDurationNs(generated.getTotalDurationNs())
                .build();
    }
}
