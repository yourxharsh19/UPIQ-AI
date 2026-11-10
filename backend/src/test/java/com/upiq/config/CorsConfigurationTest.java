package com.upiq.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.assertj.AssertableApplicationContext;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.cors.CorsConfigurationSource;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CorsConfigurationTest {
    private final ApplicationContextRunner contextRunner = new ApplicationContextRunner()
            .withUserConfiguration(CorsOriginConfiguration.class);

    @Test
    void acceptsAnExplicitProductionOriginThroughTheConfigurationBean() {
        productionContext("upiq.cors.allowed-origins=https://app.example.test")
                .run(context -> {
                    assertTrue(context.isRunning());
                    assertEquals("https://app.example.test",
                            context.getBean(CorsOriginConfiguration.class).getAllowedOrigins().get(0));
                    var securityConfig = new SecurityConfig(null, null, new ObjectMapper(),
                            context.getBean(CorsOriginConfiguration.class));
                    CorsConfigurationSource source = securityConfig.corsConfigurationSource();
                    MockHttpServletRequest request = new MockHttpServletRequest();
                    request.setRequestURI("/api/transactions");
                    var cors = source.getCorsConfiguration(request);
                    assertTrue(cors.checkOrigin("https://app.example.test") != null);
                    assertTrue(!Boolean.TRUE.equals(cors.getAllowCredentials()));
                });
    }

    @Test
    void rejectsWildcardProductionOriginWithAConfigurationError() {
        productionContext("upiq.cors.allowed-origins=https://app.example.test,*")
                .run(context -> assertConfigurationFailure(context, "wildcards are not allowed"));
    }

    @Test
    void rejectsMissingProductionOriginWithAConfigurationError() {
        productionContext(null)
                .run(context -> assertConfigurationFailure(context, "Production requires UPIQ_CORS_ALLOWED_ORIGINS"));
    }

    @Test
    void acceptsTheExistingLocalDevelopmentOrigin() {
        contextRunner.withPropertyValues("upiq.cors.allowed-origins=http://localhost:5173")
                .run(context -> {
                    assertTrue(context.isRunning());
                    assertEquals("http://localhost:5173",
                            context.getBean(CorsOriginConfiguration.class).getAllowedOrigins().get(0));
                });
    }

    private ApplicationContextRunner productionContext(String property) {
        ApplicationContextRunner runner = contextRunner.withInitializer(context ->
                context.getEnvironment().setActiveProfiles("prod"));
        return property == null ? runner : runner.withPropertyValues(property);
    }

    private void assertConfigurationFailure(AssertableApplicationContext context, String expectedMessage) {
        assertNotNull(context.getStartupFailure());
        Throwable failure = context.getStartupFailure();
        while (failure.getCause() != null && failure.getCause() != failure) failure = failure.getCause();
        assertNotNull(failure.getMessage());
        assertTrue(failure.getMessage().contains(expectedMessage), failure.getMessage());
    }
}
