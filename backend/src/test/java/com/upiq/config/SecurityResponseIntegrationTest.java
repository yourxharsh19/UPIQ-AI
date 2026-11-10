package com.upiq.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.upiq.auth.model.Role;
import com.upiq.auth.model.User;
import com.upiq.auth.service.JwtService;
import com.upiq.auth.service.UserService;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.web.FilterChainProxy;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.test.context.web.WebAppConfiguration;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(SpringExtension.class)
@ContextConfiguration(classes = SecurityResponseIntegrationTest.TestWebConfiguration.class)
@TestPropertySource(properties = {
        "jwt.secret=upiq-security-integration-test-signing-key-only",
        "upiq.cors.allowed-origins=http://localhost:5173"
})
@WebAppConfiguration
class SecurityResponseIntegrationTest {
    private static final String EMAIL = "security-test@example.test";
    private static final byte[] TEST_SIGNING_KEY = "upiq-security-integration-test-signing-key-only"
            .getBytes(StandardCharsets.UTF_8);

    @Autowired private WebApplicationContext context;
    @Autowired private JwtService jwtService;
    @Autowired private TestUserService userService;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        userService.setRole(Role.USER);
        mockMvc = MockMvcBuilders.webAppContextSetup(context)
                .addFilters(context.getBean(FilterChainProxy.class))
                .build();
    }

    @Test
    void missingTokenReturnsStandard401Response() throws Exception {
        assertSecurityError(null, 401, "Authentication required");
    }

    @Test
    void invalidAndExpiredTokensReturnStandard401Responses() throws Exception {
        assertSecurityError("not-a-jwt", 401, "Authentication required");
        assertSecurityError(expiredToken(), 401, "Authentication required");
    }

    @Test
    void authenticatedUserWithoutRequiredRoleGetsStandard403Response() throws Exception {
        assertSecurityError(jwtService.generateToken(EMAIL, Role.USER.name(), 42L),
                403, "You do not have permission to access this resource");
    }

    @Test
    void authorizedAdminRequestRetainsSuccessBehavior() throws Exception {
        userService.setRole(Role.ADMIN);
        mockMvc.perform(get("/api/test/admin")
                        .header("Authorization", "Bearer " + jwtService.generateToken(EMAIL, Role.ADMIN.name(), 42L)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").value("admin-ok"));
    }

    private void assertSecurityError(String token, int statusCode, String message) throws Exception {
        var request = get("/api/test/admin");
        if (token != null) request.header("Authorization", "Bearer " + token);
        mockMvc.perform(request)
                .andExpect(status().is(statusCode))
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value(message))
                .andExpect(jsonPath("$.data").doesNotExist());
    }

    private String expiredToken() {
        SecretKey key = Keys.hmacShaKeyFor(TEST_SIGNING_KEY);
        Instant now = Instant.now();
        return Jwts.builder().subject(EMAIL)
                .issuedAt(Date.from(now.minusSeconds(120)))
                .expiration(Date.from(now.minusSeconds(60)))
                .signWith(key).compact();
    }

    @RestController
    static class ProtectedTestController {
        @GetMapping("/api/test/admin")
        @PreAuthorize("hasRole('ADMIN')")
        ApiResponse<String> adminOnly() {
            return ApiResponse.success("admin-ok", "authorized");
        }
    }

    @Configuration
    @EnableWebMvc
    @Import({SecurityConfig.class, CorsOriginConfiguration.class, JwtAuthenticationFilter.class,
            JwtService.class, ProtectedTestController.class})
    static class TestWebConfiguration {
        @Bean ObjectMapper objectMapper() { return new ObjectMapper(); }
        @Bean TestUserService userService() { return new TestUserService(); }
    }

    static class TestUserService implements UserService {
        private volatile Role role = Role.USER;

        void setRole(Role role) { this.role = role; }
        private User currentUser() {
            return User.builder().id(42L).email(EMAIL).username("security-test")
                    .password("not-used").role(role).active(true).build();
        }

        @Override public User saveUser(User user) { throw new UnsupportedOperationException(); }
        @Override public Optional<User> getUserByEmail(String email) {
            return EMAIL.equals(email) ? Optional.of(currentUser()) : Optional.empty();
        }
        @Override public Optional<User> getUserByUsername(String username) { return Optional.empty(); }
        @Override public List<User> getAllUsers() { return List.of(currentUser()); }
        @Override public UserDetails loadUserByUsername(String username) { return currentUser(); }
    }
}
