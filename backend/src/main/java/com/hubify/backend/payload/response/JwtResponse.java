package com.hubify.backend.payload.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class JwtResponse {
    private String token;
    private Long id;
    private String username;
    private String displayName;
    private String email;
    private String avatarUrl;
    private String status;
}
