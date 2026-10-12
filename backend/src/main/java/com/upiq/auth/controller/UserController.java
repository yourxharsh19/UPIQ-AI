package com.upiq.auth.controller;

import com.upiq.config.ApiResponse;
import com.upiq.auth.dto.UserDTO;
import com.upiq.auth.model.User;
import com.upiq.auth.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/users")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // Helper method to convert User to UserDTO
    private UserDTO convertToDTO(User user) {
        return UserDTO.builder()
                .id(user.getId())
                .email(user.getEmail())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .active(user.isActive())
                .createdAt(user.getCreatedAt())
                .lastLoginAt(user.getLastLoginAt())
                .build();
    }

    // 🔹 Get all users
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<UserDTO>>> getAllUsers() {
        List<User> users = userService.getAllUsers();
        List<UserDTO> userDTOs = users.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        ApiResponse<List<UserDTO>> response = ApiResponse.<List<UserDTO>>builder()
                .success(true)
                .data(userDTOs)
                .message("Users retrieved successfully")
                .build();
        return ResponseEntity.ok(response);
    }

    // 🔹 Get user by email
    @GetMapping("/email/{email}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserDTO>> getUserByEmail(@PathVariable String email) {
        Optional<User> userOpt = userService.getUserByEmail(email);
        if (userOpt.isPresent()) {
            ApiResponse<UserDTO> response = ApiResponse.<UserDTO>builder()
                    .success(true)
                    .data(convertToDTO(userOpt.get()))
                    .message("User retrieved successfully")
                    .build();
            return ResponseEntity.ok(response);
        }
        ApiResponse<UserDTO> response = ApiResponse.<UserDTO>builder()
                .success(false)
                .data(null)
                .message("User not found with email: " + email)
                .build();
        return ResponseEntity.badRequest().body(response);
    }

    // 🔹 Get user by username
    @GetMapping("/username/{username}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserDTO>> getUserByUsername(@PathVariable String username) {
        Optional<User> userOpt = userService.getUserByUsername(username);
        if (userOpt.isPresent()) {
            ApiResponse<UserDTO> response = ApiResponse.<UserDTO>builder()
                    .success(true)
                    .data(convertToDTO(userOpt.get()))
                    .message("User retrieved successfully")
                    .build();
            return ResponseEntity.ok(response);
        }
        ApiResponse<UserDTO> response = ApiResponse.<UserDTO>builder()
                .success(false)
                .data(null)
                .message("User not found with username: " + username)
                .build();
        return ResponseEntity.badRequest().body(response);
    }

    // 🔹 Get current user (requires authentication)
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserDTO>> getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null || !authentication.isAuthenticated()) {
            ApiResponse<UserDTO> response = ApiResponse.<UserDTO>builder()
                    .success(false)
                    .data(null)
                    .message("Unauthorized")
                    .build();
            return ResponseEntity.status(401).body(response);
        }
        
        String email = authentication.getName();
        Optional<User> userOpt = userService.getUserByEmail(email);
        
        if (userOpt.isPresent()) {
            ApiResponse<UserDTO> response = ApiResponse.<UserDTO>builder()
                    .success(true)
                    .data(convertToDTO(userOpt.get()))
                    .message("User retrieved successfully")
                    .build();
            return ResponseEntity.ok(response);
        }
        
        ApiResponse<UserDTO> response = ApiResponse.<UserDTO>builder()
                .success(false)
                .data(null)
                .message("User not found")
                .build();
        return ResponseEntity.status(404).body(response);
    }
}

