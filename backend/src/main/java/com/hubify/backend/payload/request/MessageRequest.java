package com.hubify.backend.payload.request;

import lombok.Data;

@Data
public class MessageRequest {
    private String content;
    private Long senderId;
    private Long streamId;
    private Long conversationId;
    private String attachmentUrl;
    private String attachmentName;
    private String attachmentType;
}
