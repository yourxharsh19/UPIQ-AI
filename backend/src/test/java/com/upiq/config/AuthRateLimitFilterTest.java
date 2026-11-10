package com.upiq.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import jakarta.servlet.FilterChain;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.concurrent.atomic.AtomicInteger;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

import static org.junit.jupiter.api.Assertions.assertEquals;

class AuthRateLimitFilterTest {
    @Test
    void rejectsWindowConversionOverflowAndExcessiveWindow() {
        IllegalArgumentException overflow = assertThrows(IllegalArgumentException.class,
                () -> newFilter(Long.MAX_VALUE, 1, 1));
        assertEquals(true, overflow.getMessage().contains("overflows milliseconds"));
        assertThrows(IllegalArgumentException.class,
                () -> newFilter(AuthRateLimitFilter.MAX_WINDOW_SECONDS + 1, 1, 1));
    }

    @Test
    void rejectsZeroNegativeAndExcessiveAttemptLimits() {
        assertThrows(IllegalArgumentException.class, () -> newFilter(60, 0, 1));
        assertThrows(IllegalArgumentException.class, () -> newFilter(60, -1, 1));
        assertThrows(IllegalArgumentException.class, () -> newFilter(60, 1, 0));
        assertThrows(IllegalArgumentException.class, () -> newFilter(60, 1, -1));
        assertThrows(IllegalArgumentException.class,
                () -> newFilter(60, AuthRateLimitFilter.MAX_ATTEMPTS + 1, 1));
        assertThrows(IllegalArgumentException.class,
                () -> newFilter(60, 1, AuthRateLimitFilter.MAX_ATTEMPTS + 1));
    }

    @Test
    void rejectsZeroAndNegativeWindowsAndAcceptsUpperBoundValues() {
        assertThrows(IllegalArgumentException.class, () -> newFilter(0, 1, 1));
        assertThrows(IllegalArgumentException.class, () -> newFilter(-1, 1, 1));
        assertDoesNotThrow(() -> newFilter(AuthRateLimitFilter.MAX_WINDOW_SECONDS,
                AuthRateLimitFilter.MAX_ATTEMPTS, AuthRateLimitFilter.MAX_ATTEMPTS));
    }

    @Test
    void limitsLoginByRemoteIdentityAndPassesOtherIdentities() throws Exception {
        AuthRateLimitFilter filter = new AuthRateLimitFilter(new ObjectMapper(),
                Clock.fixed(Instant.parse("2026-01-01T00:00:00Z"), ZoneOffset.UTC), 60, 2, 1);
        AtomicInteger chainCalls = new AtomicInteger();
        FilterChain chain = (request, response) -> chainCalls.incrementAndGet();

        assertEquals(200, invoke(filter, "/api/auth/login", "192.0.2.1", chain).getStatus());
        assertEquals(200, invoke(filter, "/api/auth/login", "192.0.2.1", chain).getStatus());
        MockHttpServletResponse limited = invoke(filter, "/api/auth/login", "192.0.2.1", chain);
        assertEquals(429, limited.getStatus());
        assertEquals(200, invoke(filter, "/api/auth/login", "192.0.2.2", chain).getStatus());
        assertEquals(3, chainCalls.get());
    }

    @Test
    void registrationHasItsOwnLimitAndProtectedPathsAreNotLimited() throws Exception {
        AuthRateLimitFilter filter = new AuthRateLimitFilter(new ObjectMapper(),
                Clock.fixed(Instant.parse("2026-01-01T00:00:00Z"), ZoneOffset.UTC), 60, 1, 1);
        AtomicInteger chainCalls = new AtomicInteger();
        FilterChain chain = (request, response) -> chainCalls.incrementAndGet();
        assertEquals(200, invoke(filter, "/api/auth/register", "192.0.2.1", chain).getStatus());
        assertEquals(429, invoke(filter, "/api/auth/register", "192.0.2.1", chain).getStatus());
        assertEquals(200, invoke(filter, "/api/transactions", "192.0.2.1", chain).getStatus());
        assertEquals(2, chainCalls.get());
    }

    private MockHttpServletResponse invoke(AuthRateLimitFilter filter, String path, String remoteAddress,
            FilterChain chain) throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", path);
        request.setServletPath(path);
        request.setRemoteAddr(remoteAddress);
        MockHttpServletResponse response = new MockHttpServletResponse();
        filter.doFilter(request, response, chain);
        return response;
    }

    private AuthRateLimitFilter newFilter(long seconds, int loginLimit, int registrationLimit) {
        return new AuthRateLimitFilter(new ObjectMapper(),
                Clock.fixed(Instant.parse("2026-01-01T00:00:00Z"), ZoneOffset.UTC),
                seconds, loginLimit, registrationLimit);
    }
}
