package com.upiq.auth.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.upiq.auth.model.User;
import com.upiq.auth.service.GoogleAccountService;
import com.upiq.auth.service.GoogleLoginHandoffService;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.authentication.AuthenticationServiceException;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

public class GoogleOAuthHandlers implements AuthenticationSuccessHandler, AuthenticationFailureHandler {
    private static final ObjectMapper JSON = new ObjectMapper();
    private final String frontendOrigin;
    private final GoogleAccountService accounts;
    private final GoogleLoginHandoffService handoffs;

    GoogleOAuthHandlers(String frontendOrigin, GoogleAccountService accounts, GoogleLoginHandoffService handoffs) {
        this.frontendOrigin = frontendOrigin;
        this.accounts = accounts;
        this.handoffs = handoffs;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                       Authentication authentication) throws IOException, ServletException {
        if (!(authentication.getPrincipal() instanceof OidcUser oidcUser)) {
            onAuthenticationFailure(request, response, new AuthenticationServiceException("OIDC identity was not provided"));
            return;
        }
        try {
            User user = accounts.resolveVerifiedUser(oidcUser);
            writePopupMessage(response, "success", handoffs.issue(user));
        } catch (RuntimeException exception) {
            onAuthenticationFailure(request, response, new AuthenticationServiceException("Google sign-in failed"));
        }
    }

    @Override
    public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response,
                                        org.springframework.security.core.AuthenticationException exception) throws IOException {
        writePopupMessage(response, "failure", "authentication_failed");
    }

    private void writePopupMessage(HttpServletResponse response, String result, String value) throws IOException {
        String encodedValue = JSON.writeValueAsString(value);
        String encodedOrigin = JSON.writeValueAsString(frontendOrigin);
        String type = "success".equals(result) ? "UPIQ_GOOGLE_AUTH_SUCCESS" : "UPIQ_GOOGLE_AUTH_FAILURE";
        response.setStatus(HttpServletResponse.SC_OK);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.setContentType("text/html");
        response.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");
        response.setHeader("Pragma", "no-cache");
        response.setHeader("Referrer-Policy", "no-referrer");
        response.setHeader("X-Content-Type-Options", "nosniff");
        response.setHeader("Content-Security-Policy", "default-src 'none'; script-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'");
        response.getWriter().write("<!doctype html><meta charset=\"utf-8\"><title>Google sign-in</title>"
                + "<p>Returning to UPIQ…</p><script>if(window.history&&history.replaceState)history.replaceState(null,document.title,location.pathname);"
                + "if(window.opener){window.opener.postMessage({type:'"
                + type + "',value:" + encodedValue + "}," + encodedOrigin + ");}window.close();</script>");
    }
}
