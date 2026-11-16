package com.upiq.auth.config;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;

import com.upiq.auth.service.GoogleAccountService;
import com.upiq.auth.service.GoogleLoginHandoffService;
import com.upiq.config.CorsOriginConfiguration;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.mock;

class GoogleOAuthConfigurationTest {
    @Test
    void acceptsExplicitCredentialsAndOrigins() {
        GoogleOAuthProperties properties = configured();
        assertDoesNotThrow(() -> GoogleOAuthConfiguration.validate(properties));
    }

    @Test
    void rejectsEnabledConfigurationWithoutCredentials() {
        GoogleOAuthProperties properties = configured();
        properties.setClientSecret("");
        assertThrows(IllegalStateException.class, () -> GoogleOAuthConfiguration.validate(properties));
    }

    @Test
    void rejectsInvalidFrontendOriginAndCallback() {
        GoogleOAuthProperties invalidOrigin = configured();
        invalidOrigin.setFrontendOrigin("*");
        assertThrows(IllegalStateException.class, () -> GoogleOAuthConfiguration.validate(invalidOrigin));

        GoogleOAuthProperties invalidCallback = configured();
        invalidCallback.setRedirectUri("https://example.test/unexpected");
        assertThrows(IllegalStateException.class, () -> GoogleOAuthConfiguration.validate(invalidCallback));
    }

    @Test
    void productionRequiresHttpsOrigins() {
        GoogleOAuthProperties properties = configured();
        assertThrows(IllegalStateException.class, () -> GoogleOAuthConfiguration.validate(properties, true));
        properties.setFrontendOrigin("https://app.example.test");
        properties.setRedirectUri("https://api.example.test/login/oauth2/code/google");
        assertDoesNotThrow(() -> GoogleOAuthConfiguration.validate(properties, true));
    }

    @Test
    void disabledDefaultsDoNotRequireCredentials() {
        GoogleOAuthProperties properties = new GoogleOAuthProperties();
        assertDoesNotThrow(() -> {
            if (properties.isEnabled()) GoogleOAuthConfiguration.validate(properties);
        });
    }

    @Test
    void disabledOAuthHasNoClientRegistrationAndDoesNotRequireProviderSecrets() {
        new ApplicationContextRunner().withUserConfiguration(GoogleOAuthConfiguration.class)
                .run(context -> assertFalse(context.containsBean("googleClientRegistrationRepository")));
    }

    @Test
    void enabledOAuthRegistersGoogleClientAndMissingCredentialsFailConfiguration() {
        new ApplicationContextRunner()
                .withUserConfiguration(GoogleOAuthConfiguration.class)
                .withBean(GoogleAccountService.class, () -> mock(GoogleAccountService.class))
                .withBean(GoogleLoginHandoffService.class, () -> mock(GoogleLoginHandoffService.class))
                .withBean(CorsOriginConfiguration.class, () -> {
                    CorsOriginConfiguration cors = mock(CorsOriginConfiguration.class);
                    org.mockito.Mockito.when(cors.getAllowedOrigins()).thenReturn(List.of("http://localhost:5173"));
                    return cors;
                })
                .withPropertyValues(
                        "upiq.google.enabled=true",
                    "upiq.google.client-id=" + UUID.randomUUID(),
                        "upiq.google.client-secret=" + UUID.randomUUID())
                .run(context -> {
                    assertTrue(context.getBean(ClientRegistrationRepository.class)
                            .findByRegistrationId("google") != null);
                });

        new ApplicationContextRunner()
                .withUserConfiguration(GoogleOAuthConfiguration.class)
                .withPropertyValues("upiq.google.enabled=true")
                .run(context -> {
                    Throwable cause = context.getStartupFailure();
                    while (cause != null && !(cause instanceof IllegalStateException)) cause = cause.getCause();
                    assertNotNull(cause, "missing OAuth credentials must stop configuration");
                });
    }

    private GoogleOAuthProperties configured() {
        GoogleOAuthProperties properties = new GoogleOAuthProperties();
        properties.setEnabled(true);
        properties.setClientId(UUID.randomUUID().toString());
        properties.setClientSecret(UUID.randomUUID().toString());
        return properties;
    }
}
