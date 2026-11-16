package com.upiq.auth.service;

import com.upiq.auth.model.Role;
import com.upiq.auth.model.User;
import com.upiq.auth.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.security.authentication.BadCredentialsException;

import java.time.Clock;
import java.time.Instant;
import java.time.Duration;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class GoogleLoginHandoffServiceTest {
    @Test
    void springCreatesServiceUsingRequiredRepositoryConstructor() {
        new ApplicationContextRunner()
                .withUserConfiguration(HandoffServiceTestConfiguration.class)
                .withBean(UserRepository.class, () -> mock(UserRepository.class))
                .run(context -> {
                    assertNotNull(context.getBean(GoogleLoginHandoffService.class));
                    assertNull(context.getStartupFailure());
                });
    }

    @Test
    void handoffIsSingleUse() {
        UserRepository users = mock(UserRepository.class);
        User user = user();
        when(users.findById(3L)).thenReturn(Optional.of(user));
        GoogleLoginHandoffService service = new GoogleLoginHandoffService(users,
                Clock.fixed(Instant.parse("2026-11-16T00:00:00Z"), ZoneOffset.UTC));
        String code = service.issue(user);
        assertSame(user, service.consume(code));
        assertThrows(BadCredentialsException.class, () -> service.consume(code));
    }

    @Test
    void expiredHandoffCannotBeExchanged() {
        UserRepository users = mock(UserRepository.class);
        User user = user();
        MutableClock clock = new MutableClock(Instant.parse("2026-11-16T00:00:00Z"));
        GoogleLoginHandoffService service = new GoogleLoginHandoffService(users, clock);
        String code = service.issue(user);
        clock.advance(Duration.ofSeconds(91));
        assertThrows(BadCredentialsException.class, () -> service.consume(code));
        assertNotNull(code);
    }

    @Test
    void inactiveAccountCannotExchangeHandoff() {
        UserRepository users = mock(UserRepository.class);
        User user = user();
        user.setActive(false);
        when(users.findById(3L)).thenReturn(Optional.of(user));
        GoogleLoginHandoffService service = new GoogleLoginHandoffService(users);
        String code = service.issue(user);
        assertThrows(BadCredentialsException.class, () -> service.consume(code));
    }

    private User user() {
        return User.builder().id(3L).email("google@example.test").password("encoded")
                .username("google_test").role(Role.USER).active(true).build();
    }

    private static final class MutableClock extends Clock {
        private Instant instant;
        private MutableClock(Instant instant) { this.instant = instant; }
        void advance(Duration duration) { instant = instant.plus(duration); }
        @Override public ZoneId getZone() { return ZoneId.of("UTC"); }
        @Override public Clock withZone(ZoneId zone) { return this; }
        @Override public Instant instant() { return instant; }
    }

    @Configuration(proxyBeanMethods = false)
    @Import(GoogleLoginHandoffService.class)
    static class HandoffServiceTestConfiguration { }
}
