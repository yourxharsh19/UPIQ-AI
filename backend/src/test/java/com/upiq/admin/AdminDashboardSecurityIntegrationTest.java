package com.upiq.admin;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.upiq.auth.model.Role;
import com.upiq.auth.model.User;
import com.upiq.auth.service.JwtService;
import com.upiq.auth.service.UserService;
import com.upiq.auth.controller.UserController;
import com.upiq.config.SecurityConfig;
import com.upiq.config.CorsOriginConfiguration;
import com.upiq.config.JwtAuthenticationFilter;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.security.web.FilterChainProxy;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.test.context.web.WebAppConfiguration;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(SpringExtension.class)
@ContextConfiguration(classes = AdminDashboardSecurityIntegrationTest.TestConfiguration.class)
@TestPropertySource(properties = {"jwt.secret=upiq-admin-integration-test-signing-key-only", "upiq.cors.allowed-origins=http://localhost:5173"})
@WebAppConfiguration
class AdminDashboardSecurityIntegrationTest {
    private static final String ADMIN_EMAIL = "administrator-test@example.test";
    private static final String NORMAL_EMAIL = "regular-user-test@example.test";
    private static final String KEY = "upiq-admin-integration-test-signing-key-only";
    @Autowired private WebApplicationContext context;
    @Autowired private JwtService jwtService;
    @Autowired private TestUsers users;
    @Autowired private AdminDashboardService service;
    private MockMvc mvc;

    @BeforeEach void setup() {
        mvc = MockMvcBuilders.webAppContextSetup(context).addFilters(context.getBean(FilterChainProxy.class)).build();
        when(service.getSummary()).thenReturn(AdminDashboardResponse.builder().userCount(3).activeUserCount(2)
                .transactionCount(5).recordedIncome(java.math.BigDecimal.TEN).recordedExpenses(java.math.BigDecimal.ONE).build());
    }

    @Test void adminCanReadAggregateDashboardAndExistingAdminDirectory() throws Exception {
        mvc.perform(get("/api/admin/dashboard").header("Authorization", token(ADMIN_EMAIL, Role.ADMIN, 19L)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.userCount").value(3));
        mvc.perform(get("/api/v1/users").header("Authorization", token(ADMIN_EMAIL, Role.ADMIN, 19L)))
                .andExpect(status().isOk());
    }

    @Test void ordinaryUserIsForbiddenAndMissingTokenIsUnauthorized() throws Exception {
        mvc.perform(get("/api/admin/dashboard").header("Authorization", token(NORMAL_EMAIL, Role.USER, 20L)))
                .andExpect(status().isForbidden()).andExpect(jsonPath("$.success").value(false));
        mvc.perform(get("/api/v1/users").header("Authorization", token(NORMAL_EMAIL, Role.USER, 20L)))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/admin/dashboard")).andExpect(status().isUnauthorized());
    }

    private String token(String email, Role role, Long userId) { return "Bearer " + jwtService.generateToken(email, role.name(), userId); }

    @Configuration @EnableWebMvc
    @Import({SecurityConfig.class, CorsOriginConfiguration.class, JwtAuthenticationFilter.class, JwtService.class,
            AdminDashboardController.class, UserController.class})
    static class TestConfiguration {
        @Bean ObjectMapper objectMapper() { return new ObjectMapper(); }
        @Bean TestUsers userService() { return new TestUsers(); }
        @Bean AdminDashboardService adminDashboardService() { return mock(AdminDashboardService.class); }
    }

    static class TestUsers implements UserService {
        private final Map<String, User> accounts = Map.of(
                ADMIN_EMAIL, user(19L, ADMIN_EMAIL, Role.ADMIN),
                NORMAL_EMAIL, user(20L, NORMAL_EMAIL, Role.USER));
        @Override public User saveUser(User user) { throw new UnsupportedOperationException(); }
        @Override public Optional<User> getUserByEmail(String email) { return Optional.ofNullable(accounts.get(email)); }
        @Override public Optional<User> getUserByUsername(String username) { return Optional.empty(); }
        @Override public List<User> getAllUsers() { return List.copyOf(accounts.values()); }
        @Override public UserDetails loadUserByUsername(String username) { return accounts.get(username); }
        private static User user(Long id, String email, Role role) {
            return User.builder().id(id).email(email).password("unused").role(role).active(true).build();
        }
    }
}
