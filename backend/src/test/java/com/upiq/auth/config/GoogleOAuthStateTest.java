package com.upiq.auth.config;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.oauth2.client.web.HttpSessionOAuth2AuthorizationRequestRepository;
import org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.InMemoryClientRegistrationRepository;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;
import org.springframework.mock.web.MockHttpServletRequest;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class GoogleOAuthStateTest {
    private final HttpSessionOAuth2AuthorizationRequestRepository repository = new HttpSessionOAuth2AuthorizationRequestRepository();

    @Test
    void rejectsMissingOrTamperedOAuthState() {
        MockHttpServletRequest authorizeRequest = new MockHttpServletRequest();
        MockHttpServletResponse authorizeResponse = new MockHttpServletResponse();
        repository.saveAuthorizationRequest(request("expected-state"), authorizeRequest, authorizeResponse);

        MockHttpServletRequest missingState = new MockHttpServletRequest();
        assertNull(repository.removeAuthorizationRequest(missingState, new MockHttpServletResponse()));

        MockHttpServletRequest tamperedState = new MockHttpServletRequest();
        tamperedState.setSession(authorizeRequest.getSession());
        tamperedState.setParameter("state", "attacker-state");
        assertNull(repository.removeAuthorizationRequest(tamperedState, new MockHttpServletResponse()));
    }

    @Test
    void acceptsOnlyMatchingOAuthStateAndConsumesAuthorizationRequest() {
        MockHttpServletRequest authorizeRequest = new MockHttpServletRequest();
        repository.saveAuthorizationRequest(request("expected-state"), authorizeRequest, new MockHttpServletResponse());
        MockHttpServletRequest callback = new MockHttpServletRequest();
        callback.setSession(authorizeRequest.getSession());
        callback.setParameter("state", "expected-state");

        assertNotNull(repository.removeAuthorizationRequest(callback, new MockHttpServletResponse()));
        assertNull(repository.removeAuthorizationRequest(callback, new MockHttpServletResponse()));
    }

    @Test
    void springOidcResolverCreatesStateAndNonceForGoogleAuthorization() {
        ClientRegistration google = ClientRegistration.withRegistrationId("google")
                .clientId(UUID.randomUUID().toString())
                .clientSecret(UUID.randomUUID().toString())
                .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_POST)
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .redirectUri("http://localhost:8080/login/oauth2/code/google")
                .scope("openid", "profile", "email")
                .authorizationUri("https://accounts.google.com/o/oauth2/v2/auth")
                .tokenUri("https://oauth2.googleapis.com/token")
                .userInfoUri("https://openidconnect.googleapis.com/v1/userinfo")
                .userNameAttributeName("sub")
                .jwkSetUri("https://www.googleapis.com/oauth2/v3/certs")
                .issuerUri("https://accounts.google.com")
                .clientName("Google")
                .build();
        DefaultOAuth2AuthorizationRequestResolver resolver = new DefaultOAuth2AuthorizationRequestResolver(
                new InMemoryClientRegistrationRepository(google), "/oauth2/authorization");
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/oauth2/authorization/google");
        request.setServletPath("/oauth2/authorization/google");

        OAuth2AuthorizationRequest authorization = resolver.resolve(request);
        assertNotNull(authorization.getState());
        assertNotNull(authorization.getAttributes().get("nonce"));
        assertTrue(authorization.getScopes().contains("openid"));
    }

    private OAuth2AuthorizationRequest request(String state) {
        return OAuth2AuthorizationRequest.authorizationCode()
                .authorizationUri("https://accounts.google.com/o/oauth2/v2/auth")
                .clientId("test-client")
                .redirectUri("http://localhost:8080/login/oauth2/code/google")
                .state(state)
                .authorizationRequestUri("https://accounts.google.com/o/oauth2/v2/auth?state=" + state)
                .build();
    }
}
