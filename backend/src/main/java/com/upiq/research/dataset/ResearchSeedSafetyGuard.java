package com.upiq.research.dataset;

import com.upiq.research.config.ResearchSeedingProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.util.Arrays;
import java.util.Locale;

/**
 * EXPERIMENTAL: refuses to seed production/Neon databases.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ResearchSeedSafetyGuard {

    private final ResearchSeedingProperties properties;
    private final Environment environment;
    private final DataSource dataSource;

    public void assertSafeToSeed() {
        if (!properties.isEnabled()) {
            throw new IllegalStateException(
                    "Research seeding is disabled. Set research.seeding.enabled=true only with the research profile.");
        }

        int passwordBytes = properties.getUserPassword() == null ? 0
                : properties.getUserPassword().getBytes(java.nio.charset.StandardCharsets.UTF_8).length;
        if (passwordBytes < 12 || passwordBytes > 72) {
            throw new IllegalStateException(
                    "Research seeding requires an explicit RESEARCH_SEEDING_USER_PASSWORD of 12 to 72 UTF-8 bytes");
        }

        boolean researchProfileActive = Arrays.stream(environment.getActiveProfiles())
                .anyMatch(profile -> "research".equalsIgnoreCase(profile));
        if (properties.isRequireResearchProfile() && !researchProfileActive) {
            throw new IllegalStateException(
                    "Research seeding requires Spring profile 'research'. Production/default profiles must not seed.");
        }

        String jdbcUrl = resolveJdbcUrl();
        String lowerUrl = jdbcUrl.toLowerCase(Locale.ROOT);
        for (String blocked : properties.getBlockedDatasourceSubstrings()) {
            if (blocked != null && !blocked.isBlank() && lowerUrl.contains(blocked.toLowerCase(Locale.ROOT))) {
                throw new IllegalStateException(
                        "Refusing research seed: datasource URL looks like production (" + blocked + "). "
                                + "Use a local database such as jdbc:postgresql://localhost:5432/upiq_research.");
            }
        }

        log.info("Research seed safety checks passed for the configured research datasource");
    }

    public String resolveJdbcUrl() {
        try (Connection connection = dataSource.getConnection()) {
            return connection.getMetaData().getURL();
        } catch (Exception e) {
            throw new IllegalStateException("Unable to inspect datasource URL before research seeding", e);
        }
    }
}
