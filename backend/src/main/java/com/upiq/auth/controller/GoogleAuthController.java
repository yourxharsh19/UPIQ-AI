package com.upiq.auth.controller;

import com.upiq.auth.config.GoogleOAuthProperties;
import com.upiq.auth.dto.GoogleHandoffRequest;
import com.upiq.auth.service.GoogleLoginHandoffService;
import com.upiq.auth.service.JwtService;
import com.upiq.config.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.http.HttpStatus;

import java.util.Map;

@RestController
@RequestMapping("/api/auth/google")
@RequiredArgsConstructor
public class GoogleAuthController {
    private final GoogleOAuthProperties properties;
    private final GoogleLoginHandoffService handoffs;
    private final JwtService jwtService;

    @GetMapping("/status")
    public ResponseEntity<ApiResponse<Map<String, Boolean>>> status() {
        return ResponseEntity.ok(ApiResponse.success(Map.of("enabled", properties.isEnabled()), "Google sign-in status retrieved"));
    }

    @PostMapping("/exchange")
    public ResponseEntity<ApiResponse<Map<String, Object>>> exchange(@Valid @RequestBody GoogleHandoffRequest request) {
        try {
            var user = handoffs.consume(request.code());
            String token = jwtService.generateToken(user.getEmail(), user.getRole().name(), user.getId());
            return ResponseEntity.ok(ApiResponse.success(Map.<String, Object>of("token", token), "Login successful"));
        } catch (BadCredentialsException exception) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.<Map<String, Object>>builder().success(false).data(null)
                            .message("Google sign-in could not be completed").build());
        }
    }
}
