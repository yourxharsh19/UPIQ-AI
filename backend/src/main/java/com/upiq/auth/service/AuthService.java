package com.upiq.auth.service;

import com.upiq.auth.dto.LoginRequest;
import com.upiq.auth.dto.RegisterRequest;
import com.upiq.auth.model.Role;
import com.upiq.auth.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Transactional
    public String registerUser(RegisterRequest request) {
        // Check if email already exists
        if (userService.getUserByEmail(request.getEmail()).isPresent()) {
            return "User already exists with this email!";
        }

        // Check if username already exists (if provided)
        if (request.getUserName() != null && !request.getUserName().isEmpty()) {
            if (userService.getUserByUsername(request.getUserName()).isPresent()) {
                return "Username already taken!";
            }
        }

        // Public self-registration can never grant elevated privileges.
        Role userRole = Role.USER;

        // Build user - explicitly set role in the chain to override @Builder.Default
        User user = User.builder()
                .email(request.getEmail())
                .username(request.getUserName() != null ? request.getUserName() : request.getEmail().split("@")[0])
                .fullName(request.getUserName())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(userRole) // Must be set explicitly to override @Builder.Default
                .active(true)
                .build();

        // Ensure role is set correctly (explicitly set again in case builder default
        // interferes)
        user.setRole(userRole);

        User savedUser = userService.saveUser(user);

        return "User registered successfully!";
    }

    public String loginUser(LoginRequest request) {
        var userOpt = userService.getUserByEmail(request.getEmail());

        if (userOpt.isEmpty()) {
            return "Invalid credentials!";
        }

        User user = userOpt.get();

        if (!user.isActive()) {
            return "Account is disabled. Please contact support.";
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            return "Invalid credentials!";
        }

        // Generate JWT token with userId
        String token = jwtService.generateToken(user.getEmail(), user.getRole().name(), user.getId());
        return token;
    }
}
