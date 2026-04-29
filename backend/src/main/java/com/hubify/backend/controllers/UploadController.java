package com.hubify.backend.controllers;

import com.hubify.backend.payload.response.UploadResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/uploads")
public class UploadController {

    @Value("${hubify.upload-dir:uploads}")
    private String uploadDir;

    @PostMapping("/avatar")
    public ResponseEntity<UploadResponse> uploadAvatar(@RequestParam("file") MultipartFile file) throws IOException {
        return ResponseEntity.ok(storeFile(file, "avatars"));
    }

    @PostMapping("/attachment")
    public ResponseEntity<UploadResponse> uploadAttachment(@RequestParam("file") MultipartFile file) throws IOException {
        return ResponseEntity.ok(storeFile(file, "attachments"));
    }

    private UploadResponse storeFile(MultipartFile file, String subDirectory) throws IOException {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }

        Path basePath = Paths.get(uploadDir, subDirectory).toAbsolutePath().normalize();
        Files.createDirectories(basePath);

        String originalName = StringUtils.cleanPath(file.getOriginalFilename() == null ? "file" : file.getOriginalFilename());
        String extension = "";
        int dotIndex = originalName.lastIndexOf('.');
        if (dotIndex >= 0) {
            extension = originalName.substring(dotIndex);
        }

        String fileName = UUID.randomUUID() + extension;
        Path targetLocation = basePath.resolve(fileName);
        Files.copy(file.getInputStream(), targetLocation);

        String url = ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/uploads/")
                .path(subDirectory)
                .path("/")
                .path(fileName)
                .toUriString();

        return new UploadResponse(url, originalName, file.getContentType());
    }
}