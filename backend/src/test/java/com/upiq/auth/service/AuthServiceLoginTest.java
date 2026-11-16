package com.upiq.auth.service;

import com.upiq.auth.dto.LoginRequest;
import com.upiq.auth.model.Role;
import com.upiq.auth.model.User;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verify;

class AuthServiceLoginTest {
    private final UserService users = mock(UserService.class);
    private BCryptPasswordEncoder passwords;
    private AuthService service;

    @BeforeEach void setUp() {
        passwords = spy(new BCryptPasswordEncoder());
        service = new AuthService(users, passwords, null);
    }

    @Test
    void unknownEmailReturnsGenericFailureAfterPasswordHashComparison() {
        when(users.getUserByEmail("missing@example.test")).thenReturn(Optional.empty());
        assertEquals("Invalid credentials!", service.loginUser(request("missing@example.test", "wrong")));
        verify(passwords).matches(eq("wrong"), anyString());
        verify(users).getUserByEmail("missing@example.test");
    }

    @Test
    void disabledAccountReturnsSameGenericFailureAndChecksPassword() {
        String encoded = passwords.encode("account password");
        User disabled = User.builder().email("disabled@example.test").password(encoded).role(Role.USER).active(false).build();
        when(users.getUserByEmail(disabled.getEmail())).thenReturn(Optional.of(disabled));
        assertEquals("Invalid credentials!", service.loginUser(request(disabled.getEmail(), "wrong")));
        verify(passwords).matches("wrong", encoded);
        verify(users).getUserByEmail(disabled.getEmail());
    }

    private static LoginRequest request(String email, String password) {
        return LoginRequest.builder().email(email).password(password).build();
    }
}
