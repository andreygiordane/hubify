package com.hubify.backend.payload.response;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class UploadResponse {
    private String url;
    private String fileName;
    private String contentType;
}