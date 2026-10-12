package com.upiq.auth.service;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JwtServiceTest {

    private static final String SIGNING_SECRET = "test-only-signing-secret-that-is-at-least-256-bits-long";

    private JwtService jwtService(String secret, long expirationMillis) {
        JwtService service = new JwtService();
        ReflectionTestUtils.setField(service, "secretKey", secret);
        ReflectionTestUtils.setField(service, "expiration", expirationMillis);
        return service;
    }

    @Test
    void tokenGeneratedByConfiguredServiceValidatesWithSameKey() {
        JwtService service = jwtService(SIGNING_SECRET, 60_000);
        String token = service.generateToken("user@example.test", "USER", 17L);

        assertEquals("user@example.test", service.extractEmail(token));
        assertTrue(service.isTokenValid(token, "user@example.test"));
        assertFalse(service.isTokenValid(token, "different@example.test"));
    }

    @Test
    void tokenSignedWithDifferentKeyIsRejected() {
        String token = jwtService(SIGNING_SECRET, 60_000)
                .generateToken("user@example.test", "USER", 17L);
        JwtService verifier = jwtService("a-different-test-secret-with-at-least-256-bits", 60_000);

        RuntimeException error = assertThrows(RuntimeException.class,
                () -> verifier.extractEmail(token));
        assertNotNull(error.getCause());
    }

    @Test
    void expiredTokenIsRejected() {
        JwtService service = jwtService(SIGNING_SECRET, -1);
        String token = service.generateToken("user@example.test", "USER", 17L);

        RuntimeException error = assertThrows(RuntimeException.class,
                () -> service.isTokenValid(token, "user@example.test"));
        assertTrue(error.getCause() instanceof io.jsonwebtoken.ExpiredJwtException);
    }
}
