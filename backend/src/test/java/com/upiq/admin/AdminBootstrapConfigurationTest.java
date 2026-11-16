package com.upiq.admin;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;

class AdminBootstrapConfigurationTest {
    @Test
    void bootstrapRunnerIsAbsentByDefault() {
        new ApplicationContextRunner().withUserConfiguration(AdminBootstrapConfiguration.class)
                .run(context -> assertFalse(context.containsBean("initialAdminProvisioner")));
    }

    @Test
    void bootstrapRunnerRequiresExplicitOptIn() {
        new ApplicationContextRunner()
                .withUserConfiguration(AdminBootstrapConfiguration.class)
                .withBean(AdminBootstrapService.class, () -> mock(AdminBootstrapService.class))
                .withPropertyValues("upiq.admin.bootstrap.enabled=true")
                .run(context -> assertTrue(context.containsBean("initialAdminProvisioner")));
    }
}
