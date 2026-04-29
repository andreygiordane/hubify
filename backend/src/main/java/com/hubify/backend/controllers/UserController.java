package com.hubify.backend.controllers;

import com.hubify.backend.models.PresenceStatus;
import com.hubify.backend.models.User;
import com.hubify.backend.payload.request.PasswordChangeRequest;
import com.hubify.backend.payload.request.PresenceStatusRequest;
import com.hubify.backend.payload.request.UserProfileRequest;
import com.hubify.backend.payload.response.JwtResponse;
import com.hubify.backend.payload.response.MessageResponse;
import com.hubify.backend.payload.response.UserResponse;
import com.hubify.backend.repositories.UserRepository;
import com.hubify.backend.security.JwtUtils;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;

    private String resolveStatus(PresenceStatus status) {
        return (status != null ? status : PresenceStatus.OFFLINE).name();
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();

        return userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private UserResponse toResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getAvatarUrl(),
                resolveStatus(user.getStatus())
        );
    }

    @GetMapping
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        var users = userRepository.findAll(Sort.by(Sort.Direction.ASC, "username"))
                .stream()
                .map(this::toResponse)
                .toList();

        return ResponseEntity.ok(users);
    }

    @PutMapping("/me/status")
    public ResponseEntity<UserResponse> updateMyStatus(@Valid @RequestBody PresenceStatusRequest request) {
        User user = getCurrentUser();
        PresenceStatus status = PresenceStatus.valueOf(request.getStatus().toUpperCase());
        user.setStatus(status);
        userRepository.save(user);
        
        UserResponse response = toResponse(user);
        messagingTemplate.convertAndSend("/topic/users/status", response);
        
        return ResponseEntity.ok(response);
    }

    @PutMapping("/me/profile")
    public ResponseEntity<?> updateMyProfile(@Valid @RequestBody UserProfileRequest request) {
        User user = getCurrentUser();

        String nextUsername = request.getUsername().trim();
        if (!user.getUsername().equals(nextUsername) && userRepository.existsByUsername(nextUsername)) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: Username is already taken!"));
        }

        user.setUsername(nextUsername);
        String avatarUrl = request.getAvatarUrl();
        user.setAvatarUrl(avatarUrl != null && !avatarUrl.isBlank() ? avatarUrl.trim() : null);
        userRepository.save(user);

        Authentication authentication = new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities());
        String token = jwtUtils.generateJwtToken(authentication);

        return ResponseEntity.ok(new JwtResponse(
                token,
                user.getId(),
                user.getUsername(),
                user.getDisplayName(),
                user.getEmail(),
                user.getAvatarUrl(),
                resolveStatus(user.getStatus())
        ));
    }

    @PutMapping("/me/password")
    public ResponseEntity<MessageResponse> changeMyPassword(@Valid @RequestBody PasswordChangeRequest request) {
        User user = getCurrentUser();

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            return ResponseEntity.badRequest().body(new MessageResponse("Error: current password is invalid."));
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        return ResponseEntity.ok(new MessageResponse("Password updated successfully!"));
    }
}