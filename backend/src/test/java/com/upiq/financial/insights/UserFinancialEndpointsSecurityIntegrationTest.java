package com.upiq.financial.insights;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.upiq.auth.model.Role;
import com.upiq.auth.model.User;
import com.upiq.auth.service.JwtService;
import com.upiq.auth.service.UserService;
import com.upiq.config.CorsOriginConfiguration;
import com.upiq.config.JwtAuthenticationFilter;
import com.upiq.config.SecurityConfig;
import com.upiq.notifications.NotificationController;
import com.upiq.notifications.NotificationItem;
import com.upiq.notifications.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.FilterChainProxy;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.test.context.web.WebAppConfiguration;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.List;
import java.util.Optional;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(SpringExtension.class)
@ContextConfiguration(classes = UserFinancialEndpointsSecurityIntegrationTest.TestConfiguration.class)
@TestPropertySource(properties = {
        "jwt.secret=upiq-user-financial-endpoints-test-key-only",
        "upiq.cors.allowed-origins=http://localhost:5173"
})
@WebAppConfiguration
class UserFinancialEndpointsSecurityIntegrationTest {
    private static final String EMAIL = "feature-endpoints-test@example.test";

    @Autowired private WebApplicationContext context;
    @Autowired private JwtService jwtService;
    @Autowired private NotificationService notificationService;
    @Autowired private FinancialInsightsService insightsService;
    @Autowired private TestUsers users;
    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders.webAppContextSetup(context)
                .addFilters(context.getBean(FilterChainProxy.class)).build();
        when(notificationService.getNotifications(42L)).thenReturn(List.of(NotificationItem.builder()
                .id("test-notification").type("spending_change").title("Spending changed")
                .message("Monthly category comparison available.").build()));
        when(insightsService.getInsights(42L)).thenReturn(FinancialInsightsResponse.builder()
                .month(YearMonth.now()).income(new BigDecimal("100.00"))
                .expenses(new BigDecimal("40.00")).net(new BigDecimal("60.00"))
                .insights(List.of("Verified aggregate totals are available."))
                .explanation("Aggregate explanation").aiGenerated(false).build());
    }

    @Test
    void notificationAndInsightEndpointsRequireAuthentication() throws Exception {
        mvc.perform(get("/api/notifications")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/financial-insights")).andExpect(status().isUnauthorized());
    }

    @Test
    void authenticatedPrincipalIdScopesBothResponses() throws Exception {
        String token = jwtService.generateToken(EMAIL, Role.USER.name(), 42L);
        mvc.perform(get("/api/notifications").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data[0].id").value("test-notification"));
        mvc.perform(get("/api/financial-insights").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.income").value(100.00));
        verify(notificationService).getNotifications(42L);
        verify(insightsService).getInsights(42L);
    }

    @Configuration
    @EnableWebMvc
    @Import({SecurityConfig.class, CorsOriginConfiguration.class, JwtAuthenticationFilter.class,
            JwtService.class, NotificationController.class, FinancialInsightsController.class})
    static class TestConfiguration {
        @Bean ObjectMapper objectMapper() { return new ObjectMapper(); }
        @Bean TestUsers userService() { return new TestUsers(); }
        @Bean NotificationService notificationService() { return mock(NotificationService.class); }
        @Bean FinancialInsightsService financialInsightsService() { return mock(FinancialInsightsService.class); }
    }

    static class TestUsers implements UserService {
        private User user() {
            return User.builder().id(42L).email(EMAIL).username("feature-test")
                    .password("unused").role(Role.USER).active(true).build();
        }
        @Override public User saveUser(User user) { throw new UnsupportedOperationException(); }
        @Override public Optional<User> getUserByEmail(String email) { return EMAIL.equals(email) ? Optional.of(user()) : Optional.empty(); }
        @Override public Optional<User> getUserByUsername(String username) { return Optional.empty(); }
        @Override public List<User> getAllUsers() { return List.of(); }
        @Override public UserDetails loadUserByUsername(String username) { return user(); }
    }
}
