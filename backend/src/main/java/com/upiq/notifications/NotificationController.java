package com.upiq.notifications;

import com.upiq.auth.model.User;
import com.upiq.config.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;

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

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(service.getUnreadCount(user.getId()), "Unread count retrieved"));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<ApiResponse<NotificationItem>> markRead(@AuthenticationPrincipal User user,
            @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(service.markRead(user.getId(), id), "Notification marked read"));
    }

    @PatchMapping("/{id}/dismiss")
    public ResponseEntity<ApiResponse<NotificationItem>> dismiss(@AuthenticationPrincipal User user,
            @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(service.dismiss(user.getId(), id), "Notification dismissed"));
    }
}
