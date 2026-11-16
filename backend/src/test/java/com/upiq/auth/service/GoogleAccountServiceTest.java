package com.upiq.auth.service;

import com.upiq.auth.model.Role;
import com.upiq.auth.model.User;
import com.upiq.auth.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.AuthenticationServiceException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class GoogleAccountServiceTest {
    private UserRepository users;
    private PasswordEncoder encoder;
    private GoogleAccountService service;
    private User savedUser;

    @BeforeEach
    void setUp() {
        users = mock(UserRepository.class);
        encoder = mock(PasswordEncoder.class);
        when(encoder.encode(any())).thenReturn("encoded-random-password");
        service = new GoogleAccountService(users, encoder);
    }

    @Test
    void verifiedSubjectCreatesNormalUserAndRepeatedSignInResolvesSameUser() {
        OidcUser identity = identity("google-subject-1", "Person@Example.test", true);
        when(users.findByGoogleSubject("google-subject-1")).thenAnswer(invocation -> Optional.ofNullable(savedUser));
        when(users.findByEmailIgnoreCase("person@example.test")).thenReturn(Optional.empty());
        when(users.save(any(User.class))).thenAnswer(invocation -> {
            savedUser = invocation.getArgument(0);
            return savedUser;
        });

        User first = service.resolveVerifiedUser(identity);
        User second = service.resolveVerifiedUser(identity);

        assertEquals(Role.USER, first.getRole());
        assertEquals("person@example.test", first.getEmail());
        assertEquals("google-subject-1", first.getGoogleSubject());
        assertSame(first, second);
        verify(users, times(1)).save(any(User.class));
    }

    @Test
    void refusesUnverifiedEmail() {
        assertThrows(AuthenticationServiceException.class,
                () -> service.resolveVerifiedUser(identity("subject", "person@example.test", false)));
        verifyNoInteractions(users);
    }

    @Test
    void doesNotLinkExistingAccountByEmail() {
        when(users.findByGoogleSubject("subject")).thenReturn(Optional.empty());
        when(users.findByEmailIgnoreCase("person@example.test")).thenReturn(Optional.of(user()));
        assertThrows(AuthenticationServiceException.class,
                () -> service.resolveVerifiedUser(identity("subject", "person@example.test", true)));
        verify(users, never()).save(any());
    }

    @Test
    void disabledSubjectCannotSignIn() {
        User disabled = user();
        disabled.setActive(false);
        when(users.findByGoogleSubject("subject")).thenReturn(Optional.of(disabled));
        assertThrows(AuthenticationServiceException.class,
                () -> service.resolveVerifiedUser(identity("subject", "person@example.test", true)));
    }

    private OidcUser identity(String subject, String email, boolean verified) {
        OidcUser identity = mock(OidcUser.class);
        when(identity.getSubject()).thenReturn(subject);
        when(identity.getEmail()).thenReturn(email);
        when(identity.getClaim("email_verified")).thenReturn(verified);
        when(identity.getFullName()).thenReturn("Test Person");
        return identity;
    }

    private User user() {
        return User.builder().id(7L).email("person@example.test").username("google_test")
                .password("encoded").role(Role.USER).active(true).build();
    }
}
