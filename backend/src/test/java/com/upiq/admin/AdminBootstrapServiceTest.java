package com.upiq.admin;

import com.upiq.auth.model.Role;
import com.upiq.auth.model.User;
import com.upiq.auth.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.ConnectionCallback;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class AdminBootstrapServiceTest {
    private AdminBootstrapProperties properties;
    private UserRepository users;
    private PasswordEncoder encoder;
    private JdbcTemplate jdbcTemplate;
    private AdminBootstrapService service;
    private String email;
    private String password;

    @BeforeEach
    void setUp() {
        properties = new AdminBootstrapProperties();
        email = "bootstrap-" + UUID.randomUUID() + "@example.test";
        password = UUID.randomUUID().toString() + UUID.randomUUID().toString();
        properties.setEmail(email);
        properties.setPassword(password);
        users = mock(UserRepository.class);
        encoder = mock(PasswordEncoder.class);
        jdbcTemplate = mock(JdbcTemplate.class);
        when(encoder.encode(any())).thenReturn("bcrypt-hash");
        doReturn(null).when(jdbcTemplate).execute(any(ConnectionCallback.class));
        service = new AdminBootstrapService(properties, users, encoder, jdbcTemplate);
    }

    @Test
    void createsHashedAdminOnlyWhenNoneExists() {
        when(users.countByRole(Role.ADMIN)).thenReturn(0L);
        when(users.findByEmailIgnoreCase(email.toLowerCase(java.util.Locale.ROOT))).thenReturn(Optional.empty());
        service.provisionInitialAdmin();
        var captor = org.mockito.ArgumentCaptor.forClass(User.class);
        verify(users).save(captor.capture());
        assertEquals(Role.ADMIN, captor.getValue().getRole());
        assertEquals(email.toLowerCase(java.util.Locale.ROOT), captor.getValue().getEmail());
        assertEquals("bcrypt-hash", captor.getValue().getPassword());
        verify(encoder).encode(password);
    }

    @Test
    void existingAdminPreventsCredentialOverwrite() {
        when(users.countByRole(Role.ADMIN)).thenReturn(1L);
        service.provisionInitialAdmin();
        verify(users, never()).save(any());
        verifyNoInteractions(encoder);
    }

    @Test
    void normalAccountWithBootstrapEmailFailsWithoutPromotion() {
        when(users.countByRole(Role.ADMIN)).thenReturn(0L);
        when(users.findByEmailIgnoreCase(email.toLowerCase(java.util.Locale.ROOT))).thenReturn(Optional.of(User.builder().role(Role.USER).build()));
        assertThrows(IllegalStateException.class, service::provisionInitialAdmin);
        verify(users, never()).save(any());
    }

    @Test
    void invalidConfigurationFailsBeforeDatabaseLockOrWrites() {
        properties.setPassword("x");
        assertThrows(IllegalStateException.class, service::provisionInitialAdmin);
        verifyNoInteractions(jdbcTemplate, users, encoder);
    }
}
