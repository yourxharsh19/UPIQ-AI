package com.upiq.auth.controller;

import com.upiq.auth.config.GoogleOAuthProperties;
import com.upiq.auth.dto.GoogleHandoffRequest;
import com.upiq.auth.model.Role;
import com.upiq.auth.model.User;
import com.upiq.auth.service.GoogleLoginHandoffService;
import com.upiq.auth.service.JwtService;
import org.springframework.security.authentication.BadCredentialsException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

class GoogleAuthControllerTest {
    @Test
    void statusReflectsOptInWithoutExposingConfiguration() {
        GoogleOAuthProperties properties = new GoogleOAuthProperties();
        GoogleAuthController controller = new GoogleAuthController(properties, mock(GoogleLoginHandoffService.class), mock(JwtService.class));
        assertEquals(false, controller.status().getBody().getData().get("enabled"));
        properties.setEnabled(true);
        assertEquals(true, controller.status().getBody().getData().get("enabled"));
    }

    @Test
    void exchangesOneUseCodeForTheExistingUpiqJwtFormat() {
        GoogleOAuthProperties properties = new GoogleOAuthProperties();
        GoogleLoginHandoffService handoffs = mock(GoogleLoginHandoffService.class);
        JwtService jwt = mock(JwtService.class);
        User user = User.builder().id(15L).email("google@example.test").role(Role.USER).build();
        when(handoffs.consume("single-use-code")).thenReturn(user);
        when(jwt.generateToken(user.getEmail(), "USER", 15L)).thenReturn("test.jwt.value");
        GoogleAuthController controller = new GoogleAuthController(properties, handoffs, jwt);

        var response = controller.exchange(new GoogleHandoffRequest("single-use-code"));
        assertEquals("test.jwt.value", response.getBody().getData().get("token"));
        verify(jwt).generateToken("google@example.test", "USER", 15L);
    }

    @Test
    void invalidExchangeCodeReturnsGenericUnauthorizedResponse() {
        GoogleOAuthProperties properties = new GoogleOAuthProperties();
        GoogleLoginHandoffService handoffs = mock(GoogleLoginHandoffService.class);
        when(handoffs.consume("wrong-code")).thenThrow(new BadCredentialsException("private handoff internals"));
        GoogleAuthController controller = new GoogleAuthController(properties, handoffs, mock(JwtService.class));

        var response = controller.exchange(new GoogleHandoffRequest("wrong-code"));
        assertEquals(401, response.getStatusCode().value());
        assertEquals("Google sign-in could not be completed", response.getBody().getMessage());
        org.junit.jupiter.api.Assertions.assertFalse(response.getBody().getMessage().contains("private"));
    }
}
