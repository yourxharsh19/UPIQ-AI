package com.upiq.notifications;

import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class NotificationItem {
    String id;
    String type;
    String title;
    String message;
}
