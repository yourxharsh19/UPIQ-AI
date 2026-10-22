package com.upiq.auth.service;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.boot.test.context.ConfigDataApplicationContextInitializer;

import static org.assertj.core.api.Assertions.assertThat;

class JwtSecretConfigurationTest {

    private static final String VALID_TEST_SECRET =
            "synthetic-test-key-material-with-at-least-256-bits-of-entropy-0001";

    private final ApplicationContextRunner contextRunner = new ApplicationContextRunner()
            .withInitializer(new ConfigDataApplicationContextInitializer())
            .withUserConfiguration(JwtService.class);

    @Test
    void productionFailsWhenSecretIsMissing() {
        contextRunner.withPropertyValues("spring.profiles.active=prod").run(context ->
                assertThat(context).hasFailed());
    }

    @Test
    void productionFailsWhenSecretIsBlank() {
        contextRunner.withPropertyValues("spring.profiles.active=prod", "JWT_SECRET=   ").run(context ->
                assertThat(context).hasFailed());
    }

    @Test
    void productionFailsWhenSecretIsBelowMinimumHmacStrength() {
        contextRunner.withPropertyValues("spring.profiles.active=prod", "JWT_SECRET=too-short-test-key").run(context ->
                assertThat(context).hasFailed());
    }

    @Test
    void productionRejectsTheKnownLocalDevelopmentFallback() {
        contextRunner.withPropertyValues("spring.profiles.active=prod",
                "JWT_SECRET=local_dev_secret_key_minimum_256_bits_for_upiq_2_0_local_development_only")
                .run(context -> assertThat(context).hasFailed());
    }

    @Test
    void productionStartsWithValidExternallySuppliedSecret() {
        contextRunner.withPropertyValues("spring.profiles.active=prod", "JWT_SECRET=" + VALID_TEST_SECRET).run(context -> {
            assertThat(context).hasNotFailed();
            assertThat(context).hasSingleBean(JwtService.class);
        });
    }

    @Test
    void localProfileRetainsDevelopmentFallback() {
        contextRunner.withPropertyValues("spring.profiles.active=local").run(context -> {
            assertThat(context).hasNotFailed();
            assertThat(context).hasSingleBean(JwtService.class);
        });
    }
}
