package com.upiq.research.dataset;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.upiq.research.dataset.dto.BenchmarkQuestionDefinition;
import com.upiq.research.dataset.dto.ResearchDataset;
import com.upiq.research.dataset.dto.ResearchProfileDefinition;
import com.upiq.research.dataset.dto.ResearchTransactionDefinition;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * EXPERIMENTAL: loads the fixed classpath research dataset.
 * Does not generate data and does not touch the database.
 */
@Component
@RequiredArgsConstructor
public class ResearchDatasetLoader {

    static final String PROFILES_PATH = "research/dataset/profiles.json";
    static final String TRANSACTIONS_PATH = "research/dataset/transactions.json";
    static final String QUESTIONS_PATH = "research/questions/benchmark-questions.json";

    private final ObjectMapper objectMapper;

    public ResearchDataset load() {
        try {
            List<ResearchProfileDefinition> profiles = read(PROFILES_PATH, new TypeReference<>() {
            });
            List<ResearchTransactionDefinition> transactions = read(TRANSACTIONS_PATH, new TypeReference<>() {
            });
            List<BenchmarkQuestionDefinition> questions = read(QUESTIONS_PATH, new TypeReference<>() {
            });
            validate(profiles, transactions, questions);
            return ResearchDataset.builder()
                    .profiles(profiles)
                    .transactions(transactions)
                    .questions(questions)
                    .build();
        } catch (IOException e) {
            throw new IllegalStateException("Failed to load experimental research dataset from classpath", e);
        }
    }

    private <T> List<T> read(String classpathLocation, TypeReference<List<T>> type) throws IOException {
        ClassPathResource resource = new ClassPathResource(classpathLocation);
        if (!resource.exists()) {
            throw new IllegalStateException("Missing research classpath resource: " + classpathLocation);
        }
        try (InputStream inputStream = resource.getInputStream()) {
            List<T> values = objectMapper.readValue(inputStream, type);
            if (values == null || values.isEmpty()) {
                throw new IllegalStateException("Research classpath resource is empty: " + classpathLocation);
            }
            return values;
        }
    }

    private void validate(
            List<ResearchProfileDefinition> profiles,
            List<ResearchTransactionDefinition> transactions,
            List<BenchmarkQuestionDefinition> questions) {

        Set<String> profileIds = new HashSet<>();
        for (ResearchProfileDefinition profile : profiles) {
            require(profile.getId(), "profile.id");
            require(profile.getEmail(), "profile.email");
            require(profile.getUsername(), "profile.username");
            if (!profileIds.add(profile.getId())) {
                throw new IllegalStateException("Duplicate research profile id: " + profile.getId());
            }
        }

        Set<String> transactionIds = new HashSet<>();
        for (ResearchTransactionDefinition tx : transactions) {
            require(tx.getId(), "transaction.id");
            require(tx.getProfileId(), "transaction.profile_id");
            require(tx.getType(), "transaction.type");
            require(tx.getCategory(), "transaction.category");
            require(tx.getDescription(), "transaction.description");
            require(tx.getPaymentMethod(), "transaction.payment_method");
            if (tx.getAmount() == null || tx.getAmount().signum() <= 0 || tx.getAmount().scale() > 2
                    || tx.getAmount().compareTo(new java.math.BigDecimal("99999999999999999.99")) > 0) {
                throw new IllegalStateException("Invalid research transaction amount: " + tx.getId());
            }
            if (tx.getDate() == null) {
                throw new IllegalStateException("Missing research transaction date: " + tx.getId());
            }
            if (!"income".equalsIgnoreCase(tx.getType()) && !"expense".equalsIgnoreCase(tx.getType())) {
                throw new IllegalStateException("Research transaction type must be income or expense: " + tx.getId());
            }
            if (!profileIds.contains(tx.getProfileId())) {
                throw new IllegalStateException("Research transaction " + tx.getId()
                        + " references unknown profile " + tx.getProfileId());
            }
            if (!transactionIds.add(tx.getId())) {
                throw new IllegalStateException("Duplicate research transaction id: " + tx.getId());
            }
        }

        Set<String> questionIds = new HashSet<>();
        for (BenchmarkQuestionDefinition question : questions) {
            require(question.getId(), "question.id");
            require(question.getText(), "question.text");
            require(question.getCalculationType(), "question.calculation_type");
            require(question.getProfileId(), "question.profile_id");
            if (!profileIds.contains(question.getProfileId())) {
                throw new IllegalStateException("Benchmark question " + question.getId()
                        + " references unknown profile " + question.getProfileId());
            }
            if (!questionIds.add(question.getId())) {
                throw new IllegalStateException("Duplicate benchmark question id: " + question.getId());
            }
        }
    }

    private static void require(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new IllegalStateException("Research dataset missing required field: " + field);
        }
    }
}
