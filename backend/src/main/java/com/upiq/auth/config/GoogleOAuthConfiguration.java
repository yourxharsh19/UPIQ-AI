package com.upiq.auth.config;

import com.upiq.config.CorsOriginConfiguration;
import com.upiq.auth.service.GoogleAccountService;
import com.upiq.auth.service.GoogleLoginHandoffService;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.registration.InMemoryClientRegistrationRepository;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;

import java.net.URI;

@Configuration
@EnableConfigurationProperties(GoogleOAuthProperties.class)
public class GoogleOAuthConfiguration {
    @Bean
    @ConditionalOnProperty(prefix = "upiq.google", name = "enabled", havingValue = "true")
    ClientRegistrationRepository googleClientRegistrationRepository(GoogleOAuthProperties properties) {
        validate(properties, false);
        ClientRegistration google = ClientRegistration.withRegistrationId("google")
                .clientId(properties.getClientId())
                .clientSecret(properties.getClientSecret())
                .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_POST)
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .redirectUri(properties.getRedirectUri())
                .scope("openid", "profile", "email")
                .authorizationUri("https://accounts.google.com/o/oauth2/v2/auth")
                .tokenUri("https://oauth2.googleapis.com/token")
                .userInfoUri("https://openidconnect.googleapis.com/v1/userinfo")
                .userNameAttributeName("sub")
                .jwkSetUri("https://www.googleapis.com/oauth2/v3/certs")
                .issuerUri("https://accounts.google.com")
                .clientName("Google")
                .build();
        return new InMemoryClientRegistrationRepository(google);
    }

    static void validate(GoogleOAuthProperties properties) {
        validate(properties, false);
    }

    static void validate(GoogleOAuthProperties properties, boolean production) {
        if (properties.getClientId().isBlank() || properties.getClientSecret().isBlank()) {
            throw new IllegalStateException("Google OAuth is enabled but client credentials are missing");
        }
        try {
            URI origin = URI.create(properties.getFrontendOrigin());
            boolean validOrigin = ("http".equals(origin.getScheme()) || "https".equals(origin.getScheme()))
                    && origin.getHost() != null && (origin.getRawPath().isEmpty() || "/".equals(origin.getRawPath()))
                    && origin.getRawQuery() == null && origin.getRawFragment() == null;
            URI redirect = URI.create(properties.getRedirectUri());
            boolean validRedirect = ("http".equals(redirect.getScheme()) || "https".equals(redirect.getScheme()))
                    && redirect.getHost() != null && "/login/oauth2/code/google".equals(redirect.getPath())
                    && redirect.getRawQuery() == null && redirect.getRawFragment() == null;
            boolean secureProductionOrigins = !production || ("https".equals(origin.getScheme()) && "https".equals(redirect.getScheme()));
            if (!validOrigin || !validRedirect || !secureProductionOrigins) throw new IllegalArgumentException();
        } catch (RuntimeException exception) {
            throw new IllegalStateException("Google OAuth requires an explicit frontend origin and callback URI");
        }
    }

    @Bean
    @ConditionalOnProperty(prefix = "upiq.google", name = "enabled", havingValue = "true")
    GoogleOAuthHandlers googleOAuthHandlers(GoogleOAuthProperties properties,
                                           GoogleAccountService accounts,
                                           GoogleLoginHandoffService handoffs,
                                           CorsOriginConfiguration corsOrigins,
                                           Environment environment) {
        validate(properties, environment.acceptsProfiles(Profiles.of("prod")));
        if (!corsOrigins.getAllowedOrigins().contains(properties.getFrontendOrigin())) {
            throw new IllegalStateException("Google OAuth frontend origin must also be in the CORS allowlist");
        }
        return new GoogleOAuthHandlers(properties.getFrontendOrigin(), accounts, handoffs);
    }
}
