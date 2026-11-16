package com.upiq.notifications;

import lombok.Builder;
import lombok.Value;

import java.time.LocalDateTime;

@Value
@Builder
public class NotificationItem {
    Long id;
    String type;
    String title;
    String message;
    boolean read;
    LocalDateTime createdAt;
}
