package com.upiq.research.dataset;

import com.upiq.auth.model.Role;
import com.upiq.auth.model.User;
import com.upiq.auth.repository.UserRepository;
import com.upiq.research.config.ResearchSeedingProperties;
import com.upiq.research.dataset.dto.ResearchDataset;
import com.upiq.research.dataset.dto.ResearchProfileDefinition;
import com.upiq.research.dataset.dto.ResearchTransactionDefinition;
import com.upiq.transaction.model.Transaction;
import com.upiq.transaction.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

/**
 * EXPERIMENTAL: idempotent seeder for synthetic research users/transactions.
 *
 * <p>This bean is created only when ALL of the following are true:
 * <ul>
 *   <li>Spring profile {@code research} is active</li>
 *   <li>{@code research.seeding.enabled=true}</li>
 * </ul>
 *
 * <p>It still refuses blocked production JDBC URLs (including Neon).
 * It does not call {@code TransactionServiceImpl} and does not change
 * production APIs.
 *
 * <p>How to seed a dedicated local research database:
 * <pre>
 *   createdb upiq_research
 *   set SPRING_PROFILES_ACTIVE=research
 *   set RESEARCH_SEEDING_ENABLED=true
 *   set RESEARCH_DB_URL=jdbc:postgresql://localhost:5432/upiq_research
 *   mvn -f upiq-backend/pom.xml spring-boot:run
 * </pre>
 */
@Component
@Profile("research")
@ConditionalOnProperty(prefix = "research.seeding", name = "enabled", havingValue = "true")
@RequiredArgsConstructor
@Slf4j
public class ResearchDatasetSeeder implements ApplicationRunner {

    static final String RESEARCH_EMAIL_DOMAIN = "@upiq.invalid";

    private final ResearchDatasetLoader loader;
    private final ResearchSeedSafetyGuard safetyGuard;
    private final ResearchSeedingProperties properties;
    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        safetyGuard.assertSafeToSeed();
        ResearchDataset dataset = loader.load();
        log.info("Seeding experimental research dataset: {} profiles, {} transactions, {} benchmark questions (questions are classpath-only)",
                dataset.getProfiles().size(),
                dataset.getTransactions().size(),
                dataset.getQuestions().size());

        for (ResearchProfileDefinition profile : dataset.getProfiles()) {
            seedProfile(profile, dataset.getTransactions());
        }
        log.info("Experimental research dataset seed complete. Production databases were not targeted.");
    }

    private void seedProfile(ResearchProfileDefinition profile, List<ResearchTransactionDefinition> allTransactions) {
        if (profile.getEmail() == null || !profile.getEmail().toLowerCase(Locale.ROOT).endsWith(RESEARCH_EMAIL_DOMAIN)) {
            throw new IllegalStateException(
                    "Refusing to seed non-research email: " + profile.getEmail()
                            + ". Research users must use the " + RESEARCH_EMAIL_DOMAIN + " domain.");
        }

        List<ResearchTransactionDefinition> profileTransactions = allTransactions.stream()
                .filter(tx -> profile.getId().equals(tx.getProfileId()))
                .toList();

        String normalizedEmail = profile.getEmail().trim().toLowerCase(Locale.ROOT);
        User user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseGet(() -> createResearchUser(profile));

        List<Transaction> existing = transactionRepository.findByUserIdOrderByDateDesc(user.getId());
        if (existing.size() == profileTransactions.size()) {
            log.info("Research profile {} already has {} transactions; skipping insert",
                    profile.getId(), existing.size());
            return;
        }

        if (!existing.isEmpty()) {
            log.warn("Research profile {} had {} transactions, expected {}. Replacing research rows only for this user.",
                    profile.getId(), existing.size(), profileTransactions.size());
            transactionRepository.deleteByUserId(user.getId());
            transactionRepository.flush();
        }

        for (ResearchTransactionDefinition definition : profileTransactions) {
            Transaction transaction = Transaction.builder()
                    .userId(user.getId())
                    .amount(definition.getAmount())
                    .type(definition.getType().toLowerCase(Locale.ROOT))
                    .category(definition.getCategory())
                    .description(definition.getDescription())
                    .date(definition.getDate())
                    .paymentMethod(definition.getPaymentMethod())
                    .build();
            transactionRepository.save(transaction);
        }
        log.info("Seeded {} transactions for research profile {} (userId={})",
                profileTransactions.size(), profile.getId(), user.getId());
    }

    private User createResearchUser(ResearchProfileDefinition profile) {
        User user = User.builder()
                .email(profile.getEmail())
                .username(profile.getUsername())
                .fullName(profile.getFullName())
                .password(passwordEncoder.encode(properties.getUserPassword()))
                .role(Role.USER)
                .active(true)
                .build();
        User saved = userRepository.save(user);
        log.info("Created synthetic research user {} ({})", profile.getId(), saved.getEmail());
        return saved;
    }
}
