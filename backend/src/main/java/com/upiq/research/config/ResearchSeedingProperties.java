package com.upiq.research.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.ArrayList;
import java.util.List;

/**
 * EXPERIMENTAL configuration. Seeding is disabled by default and must only
 * be used with the {@code research} Spring profile against a local database.
 */
@Getter
@Setter
@ConfigurationProperties(prefix = "research.seeding")
public class ResearchSeedingProperties {

    /**
     * Master switch. Default false in application.yml.
     * Even when true, the seeder still requires the research profile
     * and refuses known production JDBC URLs.
     */
    private boolean enabled = false;

    /**
     * When true, seeding aborts unless the active Spring profile includes
     * {@code research}.
     */
    private boolean requireResearchProfile = true;

    /**
     * Password assigned to synthetic research users in the research database only.
     */
    private String userPassword = "";

    /**
     * JDBC URL substrings that must never be seeded (production Neon, etc.).
     */
    private List<String> blockedDatasourceSubstrings = new ArrayList<>(List.of(
            "neon.tech",
            "neon.database",
            "upiq-prod"
    ));
}
