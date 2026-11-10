package com.upiq.config;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;

/** Parses and validates the configured CORS origins before the application serves requests. */
@Component
public class CorsOriginConfiguration {
    private final Environment environment;
    private final String configuredOrigins;
    private List<String> allowedOrigins = List.of();

    public CorsOriginConfiguration(Environment environment,
            @Value("${upiq.cors.allowed-origins:}") String configuredOrigins) {
        this.environment = environment;
        this.configuredOrigins = configuredOrigins;
    }

    @PostConstruct
    void validateAndParseOrigins() {
        if (configuredOrigins == null || configuredOrigins.isBlank()) {
            String source = environment.acceptsProfiles(org.springframework.core.env.Profiles.of("prod"))
                    ? "Production requires UPIQ_CORS_ALLOWED_ORIGINS"
                    : "upiq.cors.allowed-origins must contain at least one explicit origin";
            throw new IllegalStateException("Invalid CORS configuration: " + source);
        }

        List<String> origins = Arrays.stream(configuredOrigins.split(",", -1))
                .map(String::trim)
                .toList();
        if (origins.stream().anyMatch(origin -> !isExplicitOrigin(origin))) {
            throw new IllegalStateException(
                    "Invalid CORS configuration: every allowed origin must be an explicit HTTP(S) origin; wildcards are not allowed");
        }
        this.allowedOrigins = origins;
    }

    List<String> getAllowedOrigins() {
        return allowedOrigins;
    }

    private boolean isExplicitOrigin(String value) {
        if (value == null || value.isBlank() || "*".equals(value)) return false;
        try {
            URI origin = new URI(value);
            String scheme = origin.getScheme();
            return scheme != null
                    && ("http".equals(scheme.toLowerCase(Locale.ROOT))
                            || "https".equals(scheme.toLowerCase(Locale.ROOT)))
                    && origin.getHost() != null
                    && origin.getUserInfo() == null
                    && (origin.getRawPath() == null || origin.getRawPath().isEmpty())
                    && origin.getRawQuery() == null
                    && origin.getRawFragment() == null
                    && origin.getPort() <= 65535;
        } catch (URISyntaxException exception) {
            return false;
        }
    }
}
