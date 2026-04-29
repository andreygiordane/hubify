package com.hubify.backend.controllers;

import com.hubify.backend.models.PresenceStatus;
import com.hubify.backend.models.User;
import com.hubify.backend.payload.request.LoginRequest;
import com.hubify.backend.payload.request.SignupRequest;
import com.hubify.backend.payload.response.JwtResponse;
import com.hubify.backend.payload.response.MessageResponse;
import com.hubify.backend.repositories.UserRepository;
import com.hubify.backend.security.JwtUtils;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    UserRepository userRepository;

    @GetMapping("/test")
    public String test() {
        return "Backend is reachable!";
    }

    @Autowired
    PasswordEncoder encoder;

    @Autowired
    JwtUtils jwtUtils;

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody LoginRequest loginRequest) {
        logger.info("RECEIVED LOGIN REQUEST for username: {}", loginRequest.getUsername());
        // Resolve: if the identifier contains '@', treat it as email and look up the username
        String identifier = loginRequest.getUsername();
        if (identifier.contains("@") && !identifier.startsWith("@")) {
            User userByEmail = userRepository.findByEmail(identifier).orElse(null);
            if (userByEmail != null) {
                identifier = userByEmail.getUsername();
            }
        } else {
            // Strip leading @ if provided
            identifier = identifier.startsWith("@") ? identifier.substring(1) : identifier;
        }

        logger.info("Attempting login for identifier: {}", identifier);
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(identifier, loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);

        User userDetails = (User) authentication.getPrincipal();
        User user = userRepository.findByUsername(userDetails.getUsername())
            .orElseThrow(() -> new RuntimeException("User not found"));
        user.setStatus(PresenceStatus.ONLINE);
        userRepository.save(user);

        return ResponseEntity.ok(new JwtResponse(jwt,
                user.getId(),
                user.getUsername(),
                user.getDisplayName(),
                user.getEmail(),
                user.getAvatarUrl(),
                user.getStatus().name()));
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody SignupRequest signUpRequest) {
        // Strip leading @ from username if user typed it
        String username = signUpRequest.getUsername().trim();
        if (username.startsWith("@")) {
            username = username.substring(1);
        }

        if (userRepository.existsByUsername(username)) {
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("Error: Username is already taken!"));
        }

        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
            return ResponseEntity
                    .badRequest()
                    .body(new MessageResponse("Error: Email is already in use!"));
        }

        // Create new user's account
        User user = User.builder()
                .username(username)
                .displayName(signUpRequest.getDisplayName())
                .email(signUpRequest.getEmail())
                .password(encoder.encode(signUpRequest.getPassword()))
                .status(PresenceStatus.OFFLINE)
                .avatarUrl(null)
                .build();

        userRepository.save(user);
        return ResponseEntity.ok(new MessageResponse("User registered successfully!"));
    }
}
