package com.hubify.application.service;

import com.hubify.application.dto.UserDTO;
import com.hubify.domain.model.User;
import com.hubify.infrastructure.persistence.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    public UserDTO register(User user) {
        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            throw new RuntimeException("Email já cadastrado.");
        }
        if (userRepository.findByUsername(user.getUsername()).isPresent()) {
            throw new RuntimeException("Nome de usuário já cadastrado.");
        }
        user.setRole("Membro da Equipe");
        user.setOnline(true);
        if (user.getAvatarUrl() == null || user.getAvatarUrl().isEmpty()) {
            user.setAvatarUrl("https://api.dicebear.com/7.x/avataaars/svg?seed=" + user.getUsername());
        }
        User savedUser = userRepository.save(user);
        return convertToDTO(savedUser);
    }

    public Optional<UserDTO> login(String username, String password) {
        Optional<User> optUser = userRepository.findByUsername(username);
        if (optUser.isPresent() && optUser.get().getPassword().equals(password)) {
            User user = optUser.get();
            user.setOnline(true);
            userRepository.save(user);
            return Optional.of(convertToDTO(user));
        }
        return Optional.empty();
    }

    public List<UserDTO> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public Optional<User> findById(String id) {
        return userRepository.findById(id);
    }

    public User save(User user) {
        return userRepository.save(user);
    }

    public UserDTO convertToDTO(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setEmail(user.getEmail());
        dto.setDisplayName(user.getDisplayName());
        dto.setAvatarUrl(user.getAvatarUrl());
        dto.setRole(user.getRole());
        dto.setOnline(user.isOnline());
        dto.setStatus(user.getStatus());
        dto.setBio(user.getBio());
        dto.setActiveDMs(user.getActiveDMs());
        return dto;
    }
}
