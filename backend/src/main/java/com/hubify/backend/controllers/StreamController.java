package com.hubify.backend.controllers;

import com.hubify.backend.models.Stream;
import com.hubify.backend.models.User;
import com.hubify.backend.repositories.StreamRepository;
import com.hubify.backend.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/streams")
public class StreamController {

    @Autowired
    private StreamRepository streamRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private com.hubify.backend.repositories.MessageRepository messageRepository;

    @Autowired
    private com.hubify.backend.repositories.StreamInviteRepository streamInviteRepository;


    @GetMapping
    public List<Stream> getAllStreams() {
        User user = getCurrentUser();
        if (user == null) return List.of();
        return streamRepository.findByMembersId(user.getId());
    }

    @PostMapping
    public ResponseEntity<Stream> createStream(@RequestBody Stream streamRequest) {
        User user = getCurrentUser();
        if (user == null) return ResponseEntity.status(401).build();

        Stream stream = new Stream();
        stream.setName(streamRequest.getName());
        stream.setDescription(streamRequest.getDescription());
        stream.setAvatarUrl(streamRequest.getAvatarUrl());
        stream.setOwnerId(user.getId());
        stream.getMembers().add(user);

        Stream savedStream = streamRepository.save(stream);
        return ResponseEntity.ok(savedStream);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteStream(@PathVariable Long id) {
        User user = getCurrentUser();
        Optional<Stream> streamOpt = streamRepository.findById(id);
        
        if (streamOpt.isEmpty()) return ResponseEntity.notFound().build();
        Stream stream = streamOpt.get();
        
        if (!stream.getOwnerId().equals(user.getId())) {
            return ResponseEntity.status(403).body("Apenas o proprietário pode excluir o grupo.");
        }
        
        // Clean up dependent entities manually to prevent 500 errors
        List<com.hubify.backend.models.StreamInvite> invites = streamInviteRepository.findByStreamId(id);
        streamInviteRepository.deleteAll(invites);

        List<com.hubify.backend.models.Message> messages = messageRepository.findByStreamIdOrderByCreatedAtAsc(id);
        messageRepository.deleteAll(messages);
        
        streamRepository.delete(stream);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateStream(@PathVariable Long id, @RequestBody Stream streamRequest) {
        User user = getCurrentUser();
        Optional<Stream> streamOpt = streamRepository.findById(id);
        
        if (streamOpt.isEmpty()) return ResponseEntity.notFound().build();
        Stream stream = streamOpt.get();
        
        if (!stream.getOwnerId().equals(user.getId())) {
            return ResponseEntity.status(403).body("Apenas o proprietário pode editar o grupo.");
        }
        
        if (streamRequest.getName() != null) stream.setName(streamRequest.getName());
        if (streamRequest.getDescription() != null) stream.setDescription(streamRequest.getDescription());
        if (streamRequest.getAvatarUrl() != null) stream.setAvatarUrl(streamRequest.getAvatarUrl());
        
        streamRepository.save(stream);
        return ResponseEntity.ok(stream);
    }

    @DeleteMapping("/{streamId}/members/{userId}")
    public ResponseEntity<?> removeMember(@PathVariable Long streamId, @PathVariable Long userId) {
        User currentUser = getCurrentUser();
        Optional<Stream> streamOpt = streamRepository.findById(streamId);
        
        if (streamOpt.isEmpty()) return ResponseEntity.notFound().build();
        Stream stream = streamOpt.get();
        
        if (!stream.getOwnerId().equals(currentUser.getId())) {
            // User can remove themselves, but only admin can remove others
            if (!currentUser.getId().equals(userId)) {
                return ResponseEntity.status(403).body("Apenas o proprietário pode remover membros.");
            }
        }
        
        // Don't let owner remove themselves this way
        if (stream.getOwnerId().equals(userId)) {
             return ResponseEntity.badRequest().body("O proprietário não pode ser removido do grupo.");
        }

        stream.getMembers().removeIf(m -> m.getId().equals(userId));
        streamRepository.save(stream);
        return ResponseEntity.ok().build();
    }


    @PostMapping("/{streamId}/members/{userId}")
    public ResponseEntity<?> addMember(@PathVariable Long streamId, @PathVariable Long userId) {
        User currentUser = getCurrentUser();
        Optional<Stream> streamOpt = streamRepository.findById(streamId);
        Optional<User> userToAddOpt = userRepository.findById(userId);

        if (streamOpt.isEmpty() || userToAddOpt.isEmpty()) return ResponseEntity.notFound().build();
        Stream stream = streamOpt.get();

        if (!stream.getOwnerId().equals(currentUser.getId())) {
            return ResponseEntity.status(403).body("Apenas o proprietário pode convidar membros.");
        }

        stream.getMembers().add(userToAddOpt.get());
        streamRepository.save(stream);
        return ResponseEntity.ok().build();
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) return null;
        return userRepository.findByUsername(authentication.getName()).orElse(null);
    }
}
