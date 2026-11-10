package com.upiq.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Clock;
import java.util.Iterator;
import java.util.LinkedHashMap;
import java.util.Map;

/** Process-local fixed-window limiter for public login and registration requests. */
@Component
public class AuthRateLimitFilter extends OncePerRequestFilter {
    private static final int MAX_IDENTITIES = 10_000;
    static final long MAX_WINDOW_SECONDS = 86_400;
    static final int MAX_ATTEMPTS = 100;
    private final ObjectMapper objectMapper;
    private final Clock clock;
    private final long windowMillis;
    private final int loginLimit;
    private final int registrationLimit;
    private final LinkedHashMap<String, Window> windows = new LinkedHashMap<>(128, 0.75f, true);

    public AuthRateLimitFilter(ObjectMapper objectMapper,
            @Value("${upiq.auth.rate-limit.window-seconds:60}") long windowSeconds,
            @Value("${upiq.auth.rate-limit.login-attempts:10}") int loginLimit,
            @Value("${upiq.auth.rate-limit.registration-attempts:5}") int registrationLimit) {
        this(objectMapper, Clock.systemUTC(), windowSeconds, loginLimit, registrationLimit);
    }

    AuthRateLimitFilter(ObjectMapper objectMapper, Clock clock, long windowSeconds,
            int loginLimit, int registrationLimit) {
        if (windowSeconds < 1) throw invalidConfiguration("window-seconds must be at least 1");
        long convertedWindowMillis;
        try {
            convertedWindowMillis = Math.multiplyExact(windowSeconds, 1_000L);
        } catch (ArithmeticException exception) {
            throw invalidConfiguration("window-seconds overflows milliseconds", exception);
        }
        if (windowSeconds > MAX_WINDOW_SECONDS) {
            throw invalidConfiguration("window-seconds must not exceed " + MAX_WINDOW_SECONDS);
        }
        validateAttemptLimit("login-attempts", loginLimit);
        validateAttemptLimit("registration-attempts", registrationLimit);
        this.objectMapper = objectMapper;
        this.clock = clock;
        this.windowMillis = convertedWindowMillis;
        this.loginLimit = loginLimit;
        this.registrationLimit = registrationLimit;
    }

    private static void validateAttemptLimit(String property, int value) {
        if (value < 1 || value > MAX_ATTEMPTS) {
            throw invalidConfiguration(property + " must be between 1 and " + MAX_ATTEMPTS);
        }
    }

    private static IllegalArgumentException invalidConfiguration(String detail) {
        return new IllegalArgumentException("Invalid authentication rate-limit configuration: " + detail);
    }

    private static IllegalArgumentException invalidConfiguration(String detail, Throwable cause) {
        return new IllegalArgumentException("Invalid authentication rate-limit configuration: " + detail, cause);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();
        return !"POST".equalsIgnoreCase(request.getMethod())
                || !("/api/auth/login".equals(path) || "/api/auth/register".equals(path));
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String path = request.getServletPath();
        int limit = "/api/auth/login".equals(path) ? loginLimit : registrationLimit;
        String identity = path + "|" + request.getRemoteAddr(); // Never trust forwarded identity headers.
        if (!allow(identity, limit)) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            objectMapper.writeValue(response.getWriter(), ApiResponse.error("Too many authentication attempts. Please wait and try again."));
            return;
        }
        chain.doFilter(request, response);
    }

    private synchronized boolean allow(String identity, int limit) {
        long now = clock.millis();
        Window current = windows.get(identity);
        if (current == null || now - current.startedAt >= windowMillis) {
            windows.put(identity, new Window(now, 1));
            while (windows.size() > MAX_IDENTITIES) {
                Iterator<Map.Entry<String, Window>> iterator = windows.entrySet().iterator();
                iterator.next();
                iterator.remove();
            }
            return true;
        }
        if (current.count >= limit) return false;
        current.count++;
        return true;
    }

    private static final class Window {
        private final long startedAt;
        private int count;
        private Window(long startedAt, int count) { this.startedAt = startedAt; this.count = count; }
    }
}
