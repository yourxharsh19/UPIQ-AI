package com.upiq.auth.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.upiq.auth.dto.RegisterRequest;
import com.upiq.auth.model.User;
import com.upiq.auth.service.AuthService;
import com.upiq.auth.service.JwtService;
import com.upiq.auth.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

class AuthControllerRegistrationTest {
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final CapturingUserService userService = new CapturingUserService();
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
        AuthService authService = new AuthService(userService, passwordEncoder, (JwtService) null);
        mockMvc = MockMvcBuilders.standaloneSetup(new AuthController(authService)).build();
    }

    @Test
    void successfulRegistrationUsesTheGenericSynchronousResponse() throws Exception {
        MvcResult result = register("new@example.test", "New Person");

        assertEquals(200, result.getResponse().getStatus());
        assertEquals(1, userService.savedUsers.size());
        assertEquals("Registration request processed. You may try signing in.",
                objectMapper.readTree(result.getResponse().getContentAsString()).path("message").asText());
    }

    @Test
    void duplicateEmailMatchesSuccessfulRegistrationResponse() throws Exception {
        MvcResult successful = register("new@example.test", "New Person");
        userService.existingEmail = "duplicate@example.test";
        MvcResult duplicate = register("duplicate@example.test", "Another Person");

        assertSameGenericResponse(successful, duplicate);
        assertEquals(1, userService.savedUsers.size());
    }

    @Test
    void duplicateUsernameMatchesSuccessfulRegistrationResponse() throws Exception {
        MvcResult successful = register("new@example.test", "New Person");
        userService.existingUsername = "Taken Name";
        MvcResult duplicate = register("other@example.test", "Taken Name");

        assertSameGenericResponse(successful, duplicate);
        assertEquals(1, userService.savedUsers.size());
    }

    private MvcResult register(String email, String username) throws Exception {
        RegisterRequest request = RegisterRequest.builder()
                .email(email)
                .userName(username)
                .password("valid-test-password")
                .build();
        return mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsBytes(request)))
                .andReturn();
    }

    private void assertSameGenericResponse(MvcResult successful, MvcResult duplicate) throws Exception {
        assertEquals(200, successful.getResponse().getStatus());
        assertEquals(successful.getResponse().getContentAsString(), duplicate.getResponse().getContentAsString());
        assertEquals(200, duplicate.getResponse().getStatus());
    }

    private static final class CapturingUserService implements UserService {
        private final List<User> savedUsers = new ArrayList<>();
        private String existingEmail;
        private String existingUsername;

        @Override public User saveUser(User user) { savedUsers.add(user); return user; }
        @Override public Optional<User> getUserByEmail(String email) {
            return email.equals(existingEmail) ? Optional.of(User.builder().email(email).build()) : Optional.empty();
        }
        @Override public Optional<User> getUserByUsername(String username) {
            return username.equals(existingUsername) ? Optional.of(User.builder().username(username).build()) : Optional.empty();
        }
        @Override public List<User> getAllUsers() { return List.of(); }
        @Override public UserDetails loadUserByUsername(String username) { throw new UnsupportedOperationException(); }
    }
}
