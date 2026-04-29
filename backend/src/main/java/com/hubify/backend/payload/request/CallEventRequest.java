package com.hubify.backend.payload.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CallEventRequest {
    private Long streamId;
    private Long conversationId;
    private String callId;
    private String eventType;
    private String mode;
    private String message;
    private String payload;
    private Boolean handRaised;
    private Boolean screenSharing;
    private Long targetUserId;
}