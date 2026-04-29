package com.hubify.backend.payload.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PresenceStatusRequest {
    @NotBlank
    private String status;
}