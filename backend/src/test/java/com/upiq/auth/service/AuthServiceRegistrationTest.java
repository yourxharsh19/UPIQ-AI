package com.upiq.auth.service;

import com.upiq.auth.dto.RegisterRequest;
import com.upiq.auth.model.Role;
import com.upiq.auth.model.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;

class AuthServiceRegistrationTest {
    private CapturingUserService userService;
    private AuthService authService;

    @BeforeEach
    void setUp() {
        userService = new CapturingUserService();
        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
        authService = new AuthService(userService, passwordEncoder, null);
    }

    @Test
    void registrationWithoutRoleCreatesUser() {
        assertRegistrationRole(null);
    }

    @Test
    void registrationWithUserRoleCreatesUser() {
        assertRegistrationRole("USER");
    }

    @Test
    void publicRegistrationWithAdminRoleStillCreatesUser() {
        assertRegistrationRole("ADMIN");
    }

    private void assertRegistrationRole(String requestedRole) {
        RegisterRequest request = RegisterRequest.builder()
                .email("person@example.com")
                .userName("Person")
                .password("password123")
                .role(requestedRole)
                .build();

        assertEquals("User registered successfully!", authService.registerUser(request));

        User savedUser = userService.savedUsers.get(0);
        assertEquals(Role.USER, savedUser.getRole());
        org.junit.jupiter.api.Assertions.assertTrue(new BCryptPasswordEncoder().matches("password123", savedUser.getPassword()));
        assertEquals("Person", savedUser.getFullName());
    }

    private static final class CapturingUserService implements UserService {
        private final List<User> savedUsers = new ArrayList<>();

        @Override public User saveUser(User user) { savedUsers.add(user); return user; }
        @Override public Optional<User> getUserByEmail(String email) { return Optional.empty(); }
        @Override public Optional<User> getUserByUsername(String username) { return Optional.empty(); }
        @Override public List<User> getAllUsers() { return List.of(); }
        @Override public org.springframework.security.core.userdetails.UserDetails loadUserByUsername(String username) {
            throw new UnsupportedOperationException("Not needed for registration test");
        }
    }
}
