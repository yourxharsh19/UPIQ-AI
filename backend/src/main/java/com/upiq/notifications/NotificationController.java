package com.upiq.notifications;

import com.upiq.auth.model.User;
import com.upiq.config.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {
    private final NotificationService service;
    @GetMapping
    public ResponseEntity<ApiResponse<List<NotificationItem>>> get(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(service.getNotifications(user.getId()), "Notifications retrieved"));
    }
}
