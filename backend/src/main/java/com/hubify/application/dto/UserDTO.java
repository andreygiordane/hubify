package com.hubify.application.dto;

import lombok.Data;

@Data
public class UserDTO {
    private String id;
    private String username;
    private String email;
    private String displayName;
    private String avatarUrl;
    private String role;
    private boolean isOnline;
    private String status;
    private String bio;
    private String activeDMs;
}
