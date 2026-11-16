package com.upiq.admin;

import com.upiq.auth.model.Role;
import com.upiq.auth.model.User;
import com.upiq.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class AdminBootstrapService {
    private static final int MIN_PASSWORD_BYTES = 12;
    private static final int MAX_BCRYPT_BYTES = 72;
    private static final long POSTGRES_ADVISORY_LOCK_ID = 0x5550495141444D49L;

    private final AdminBootstrapProperties properties;
    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;

    @Transactional
    public void provisionInitialAdmin() {
        String email = properties.getEmail().trim().toLowerCase(Locale.ROOT);
        String password = properties.getPassword();
        validate(email, password);

        // PostgreSQL transaction-scoped lock serializes simultaneous bootstrap attempts across instances.
        jdbcTemplate.execute((org.springframework.jdbc.core.ConnectionCallback<Void>) connection -> {
            try (var statement = connection.createStatement()) {
                statement.execute("SELECT pg_advisory_xact_lock(" + POSTGRES_ADVISORY_LOCK_ID + ")");
            }
            return null;
        });

        if (users.countByRole(Role.ADMIN) > 0) return;
        if (users.findByEmailIgnoreCase(email).isPresent()) {
            throw new IllegalStateException("Admin bootstrap email already belongs to a non-admin account");
        }

        User admin = User.builder()
                .email(email)
                .username("admin_" + java.util.UUID.randomUUID())
                .fullName("Administrator")
                .password(passwordEncoder.encode(password))
                .role(Role.ADMIN)
                .active(true)
                .build();
        users.save(admin);
    }

    private void validate(String email, String password) {
        if (!email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            throw new IllegalStateException("Admin bootstrap requires a valid UPIQ_ADMIN_EMAIL");
        }
        int passwordBytes = password.getBytes(StandardCharsets.UTF_8).length;
        if (passwordBytes < MIN_PASSWORD_BYTES || passwordBytes > MAX_BCRYPT_BYTES) {
            throw new IllegalStateException("Admin bootstrap password must be 12 to 72 UTF-8 bytes for the configured password encoder");
        }
    }
}
