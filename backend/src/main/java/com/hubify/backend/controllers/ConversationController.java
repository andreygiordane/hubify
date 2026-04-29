package com.hubify.backend.controllers;

import com.hubify.backend.models.Conversation;
import com.hubify.backend.models.User;
import com.hubify.backend.repositories.ConversationRepository;
import com.hubify.backend.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/conversations")
public class ConversationController {

    @Autowired
    private ConversationRepository conversationRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public List<Conversation> getMyConversations() {
        User user = getCurrentUser();
        if (user == null) return List.of();
        List<Conversation> all = conversationRepository.findByParticipantId(user.getId());
        // Filter out conversations deleted by the user
        return all.stream()
                .filter(c -> c.getDeletedByUsers() == null || !c.getDeletedByUsers().contains(user.getId()))
                .toList();
    }

    @PostMapping("/user/{otherUserId}")
    public ResponseEntity<Conversation> startConversation(@PathVariable Long otherUserId) {
        User currentUser = getCurrentUser();
        Optional<User> otherUserOpt = userRepository.findById(otherUserId);

        if (currentUser == null || otherUserOpt.isEmpty()) return ResponseEntity.status(401).build();
        
        // Check if conversation already exists
        List<Conversation> existing = conversationRepository.findBetweenParticipants(currentUser.getId(), otherUserId);
        if (!existing.isEmpty()) {
            return ResponseEntity.ok(existing.get(0));
        }

        Conversation conversation = Conversation.builder()
                .participants(Set.of(currentUser, otherUserOpt.get()))
                .build();
        
        return ResponseEntity.ok(conversationRepository.save(conversation));
    }

    @Autowired
    private com.hubify.backend.repositories.MessageRepository messageRepository;

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteConversation(@PathVariable Long id) {
        User user = getCurrentUser();
        Optional<Conversation> convOpt = conversationRepository.findById(id);
        
        if (convOpt.isEmpty()) return ResponseEntity.notFound().build();
        Conversation conv = convOpt.get();
        
        // Check if user is a participant
        if (conv.getParticipants().stream().noneMatch(p -> p.getId().equals(user.getId()))) {
            return ResponseEntity.status(403).build();
        }
        
        // Mark all current messages as deleted for THIS user
        List<com.hubify.backend.models.Message> messages = messageRepository.findByConversationIdOrderByCreatedAtAsc(id);
        messages.forEach(m -> {
            if (m.getDeletedByUsers() == null) {
                m.setDeletedByUsers(new java.util.HashSet<>());
            }
            m.getDeletedByUsers().add(user.getId());
            messageRepository.save(m);
        });

        // Add user to deletedByUsers in conversation
        if (conv.getDeletedByUsers() == null) {
            conv.setDeletedByUsers(new java.util.HashSet<>());
        }
        conv.getDeletedByUsers().add(user.getId());
        
        // If everyone deleted it, remove from DB
        if (conv.getDeletedByUsers().size() >= conv.getParticipants().size()) {
            // Manually delete messages first to be safe
            messageRepository.deleteAll(messages);
            conversationRepository.delete(conv);
        } else {
            conversationRepository.save(conv);
        }
        
        return ResponseEntity.ok().build();
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) return null;
        return userRepository.findByUsername(authentication.getName()).orElse(null);
    }
}
