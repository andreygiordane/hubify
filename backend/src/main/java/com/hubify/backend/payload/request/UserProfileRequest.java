package com.hubify.backend.payload.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UserProfileRequest {
    @NotBlank
    @Size(min = 3, max = 20)
    private String username;

    private String avatarUrl;
}