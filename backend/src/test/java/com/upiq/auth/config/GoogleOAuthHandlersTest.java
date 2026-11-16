package com.upiq.auth.config;

import com.upiq.auth.model.Role;
import com.upiq.auth.model.User;
import com.upiq.auth.service.GoogleAccountService;
import com.upiq.auth.service.GoogleLoginHandoffService;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.*;

class GoogleOAuthHandlersTest {
    @Test
    void successfulCallbackPostsOnlyOneTimeCodeToConfiguredOrigin() throws Exception {
        GoogleAccountService accounts = mock(GoogleAccountService.class);
        GoogleLoginHandoffService handoffs = mock(GoogleLoginHandoffService.class);
        OidcUser identity = mock(OidcUser.class);
        User user = User.builder().id(11L).email("google@example.test").role(Role.USER).build();
        when(accounts.resolveVerifiedUser(identity)).thenReturn(user);
        when(handoffs.issue(user)).thenReturn("opaque-one-use-code");
        GoogleOAuthHandlers handlers = new GoogleOAuthHandlers("https://app.example.test", accounts, handoffs);
        MockHttpServletResponse response = new MockHttpServletResponse();

        handlers.onAuthenticationSuccess(new MockHttpServletRequest(), response,
                new UsernamePasswordAuthenticationToken(identity, null));

        assertTrue(response.getContentAsString().contains("UPIQ_GOOGLE_AUTH_SUCCESS"));
        assertTrue(response.getContentAsString().contains("opaque-one-use-code"));
        assertTrue(response.getContentAsString().contains("https://app.example.test"));
        assertTrue(!response.getContentAsString().contains("eyJ"), "JWT material is not sent in the callback response");
        assertTrue(response.getHeader("Cache-Control").contains("no-store"));
    }

    @Test
    void providerFailureDoesNotExposeInternalExceptionDetails() throws Exception {
        GoogleOAuthHandlers handlers = new GoogleOAuthHandlers("http://localhost:5173",
                mock(GoogleAccountService.class), mock(GoogleLoginHandoffService.class));
        MockHttpServletResponse response = new MockHttpServletResponse();
        handlers.onAuthenticationFailure(new MockHttpServletRequest(), response,
                new BadCredentialsException("private provider failure details"));
        assertTrue(response.getContentAsString().contains("UPIQ_GOOGLE_AUTH_FAILURE"));
        assertTrue(!response.getContentAsString().contains("private provider failure details"));
    }
}
