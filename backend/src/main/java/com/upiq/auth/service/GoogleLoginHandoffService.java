package com.upiq.auth.service;

import com.upiq.auth.model.User;
import com.upiq.auth.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Clock;
import java.time.Instant;
import java.util.Base64;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class GoogleLoginHandoffService {
    private static final int MAX_TICKETS = 10_000;
    private static final long TICKET_LIFETIME_SECONDS = 90;
    private static final SecureRandom RANDOM = new SecureRandom();

    private final ConcurrentHashMap<String, Ticket> tickets = new ConcurrentHashMap<>();
    private final UserRepository userRepository;
    private final Clock clock;

    @Autowired
    public GoogleLoginHandoffService(UserRepository userRepository) {
        this(userRepository, Clock.systemUTC());
    }

    GoogleLoginHandoffService(UserRepository userRepository, Clock clock) {
        this.userRepository = userRepository;
        this.clock = clock;
    }

    public synchronized String issue(User user) {
        removeExpired();
        if (tickets.size() >= MAX_TICKETS) throw new IllegalStateException("Google login handoff is temporarily unavailable");
        byte[] value = new byte[32];
        RANDOM.nextBytes(value);
        String code = Base64.getUrlEncoder().withoutPadding().encodeToString(value);
        tickets.put(code, new Ticket(user.getId(), Instant.now(clock).plusSeconds(TICKET_LIFETIME_SECONDS)));
        return code;
    }

    public User consume(String code) {
        if (code == null || code.isBlank()) throw new BadCredentialsException("Invalid Google login handoff");
        Ticket ticket = tickets.remove(code);
        if (ticket == null || !ticket.expiresAt().isAfter(Instant.now(clock))) {
            throw new BadCredentialsException("Invalid Google login handoff");
        }
        return userRepository.findById(ticket.userId())
                .filter(User::isActive)
                .orElseThrow(() -> new BadCredentialsException("Invalid Google login handoff"));
    }

    private void removeExpired() {
        Instant now = Instant.now(clock);
        tickets.entrySet().removeIf(entry -> !entry.getValue().expiresAt().isAfter(now));
    }

    private record Ticket(Long userId, Instant expiresAt) { }
}
