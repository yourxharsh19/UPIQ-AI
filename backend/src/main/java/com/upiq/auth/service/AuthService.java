package com.upiq.auth.service;

import com.upiq.auth.dto.LoginRequest;
import com.upiq.auth.dto.RegisterRequest;
import com.upiq.auth.model.Role;
import com.upiq.auth.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final String INVALID_CREDENTIALS = "Invalid credentials!";
    private static final String DUMMY_PASSWORD_HASH = "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";

    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Transactional
    public String registerUser(RegisterRequest request) {
        String normalizedEmail = normalizeEmail(request.getEmail());
        // Check if email already exists
        if (userService.getUserByEmail(normalizedEmail).isPresent()) {
            return "Registration request processed. You may try signing in.";
        }

        // Check if username already exists (if provided)
        if (request.getUserName() != null && !request.getUserName().isEmpty()) {
            if (userService.getUserByUsername(request.getUserName()).isPresent()) {
                return "Registration request processed. You may try signing in.";
            }
        }

        // Public self-registration can never grant elevated privileges.
        Role userRole = Role.USER;

        // Build user - explicitly set role in the chain to override @Builder.Default
        User user = User.builder()
                .email(normalizedEmail)
                .username(request.getUserName() != null ? request.getUserName() : normalizedEmail.split("@")[0])
                .fullName(request.getUserName())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(userRole) // Must be set explicitly to override @Builder.Default
                .active(true)
                .build();

        // Ensure role is set correctly (explicitly set again in case builder default
        // interferes)
        user.setRole(userRole);

        User savedUser = userService.saveUser(user);

        return "Registration request processed. You may try signing in.";
    }

    public String loginUser(LoginRequest request) {
        var userOpt = userService.getUserByEmail(normalizeEmail(request.getEmail()));

        if (userOpt.isEmpty()) {
            passwordEncoder.matches(request.getPassword(), DUMMY_PASSWORD_HASH);
            return INVALID_CREDENTIALS;
        }

        User user = userOpt.get();

        if (!user.isActive()) {
            passwordEncoder.matches(request.getPassword(), user.getPassword());
            return INVALID_CREDENTIALS;
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            return INVALID_CREDENTIALS;
        }

        // Generate JWT token with userId
        String token = jwtService.generateToken(user.getEmail(), user.getRole().name(), user.getId());
        return token;
    }

    static String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }
}
