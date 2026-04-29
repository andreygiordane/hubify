package com.hubify.backend.payload.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class CallEventResponse {
    private LocalDateTime timestamp;
    private Long streamId;
    private Long conversationId;
    private String callId;
    private String eventType;
    private String mode;
    private String message;
    private String payload;
    private Boolean handRaised;
    private Boolean screenSharing;
    private Long userId;
    private String username;
    private String displayName;
    private String avatarUrl;
    private String status;
    private Long targetUserId;
}