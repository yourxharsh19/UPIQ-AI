package com.upiq.auth.service;

import com.upiq.auth.model.Role;
import com.upiq.auth.model.User;
import com.upiq.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationServiceException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GoogleAccountService {
    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public User resolveVerifiedUser(OidcUser identity) {
        String subject = identity.getSubject();
        String email = identity.getEmail();
        Boolean emailVerified = identity.getClaim("email_verified");
        if (subject == null || subject.isBlank() || email == null || email.isBlank() || !Boolean.TRUE.equals(emailVerified)) {
            throw new AuthenticationServiceException("Google account could not be verified");
        }

        return userRepository.findByGoogleSubject(subject).map(user -> {
            if (!user.isActive()) throw new AuthenticationServiceException("Google account could not be used");
            return user;
        }).orElseGet(() -> createNormalUser(subject, email, identity.getFullName()));
    }

    private User createNormalUser(String subject, String email, String fullName) {
        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
        if (userRepository.findByEmailIgnoreCase(normalizedEmail).isPresent()) {
            // No implicit account linking. A separate verified linking flow would be required.
            throw new AuthenticationServiceException("Sign in with the existing account before linking Google");
        }

        byte[] randomPassword = new byte[32];
        RANDOM.nextBytes(randomPassword);
        String password = Base64.getUrlEncoder().withoutPadding().encodeToString(randomPassword);
        User user = User.builder()
                .email(normalizedEmail)
                .username("google_" + UUID.randomUUID())
                .fullName(fullName)
                .password(passwordEncoder.encode(password))
                .googleSubject(subject)
                .role(Role.USER)
                .active(true)
                .build();
        return userRepository.save(user);
    }
}
