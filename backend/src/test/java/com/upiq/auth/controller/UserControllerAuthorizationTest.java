package com.upiq.auth.controller;

import com.upiq.auth.service.UserService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.junit.jupiter.SpringExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(SpringExtension.class)
@org.springframework.test.context.ContextConfiguration(classes = UserControllerAuthorizationTest.SecurityTestConfiguration.class)
class UserControllerAuthorizationTest {

    @Autowired private UserController controller;
    @Autowired private UserService userService;

    @AfterEach
    void clearSecurityContext() {
        org.springframework.security.core.context.SecurityContextHolder.clearContext();
    }

    @Test
    void regularUserCannotReadTheUserDirectoryOrLookUpOtherUsers() {
        authenticate("ROLE_USER");

        assertThrows(AccessDeniedException.class, controller::getAllUsers);
        assertThrows(AccessDeniedException.class, () -> controller.getUserByEmail("other@example.com"));
        assertThrows(AccessDeniedException.class, () -> controller.getUserByUsername("other"));
    }

    @Test
    void administratorCanReadTheUserDirectory() {
        authenticate("ROLE_ADMIN");
        when(userService.getAllUsers()).thenReturn(List.of());

        assertEquals(200, controller.getAllUsers().getStatusCode().value());
        verify(userService).getAllUsers();
    }

    @Test
    void regularUserCanStillAccessTheirOwnProfileEndpoint() {
        authenticate("ROLE_USER");
        when(userService.getUserByEmail("person@example.com")).thenReturn(java.util.Optional.empty());

        assertEquals(404, controller.getCurrentUser().getStatusCode().value());
        verify(userService).getUserByEmail("person@example.com");
    }

    private static void authenticate(String role) {
        var authentication = new UsernamePasswordAuthenticationToken("person@example.com", null,
                List.of(new SimpleGrantedAuthority(role)));
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    @Configuration
    @EnableMethodSecurity
    @Import(UserController.class)
    static class SecurityTestConfiguration {
        @Bean
        UserService userService() {
            return mock(UserService.class);
        }
    }
}
