package com.hubify.backend.controllers;

import com.hubify.backend.models.Stream;
import com.hubify.backend.models.StreamInvite;
import com.hubify.backend.models.User;
import com.hubify.backend.repositories.StreamInviteRepository;
import com.hubify.backend.repositories.StreamRepository;
import com.hubify.backend.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/invites")
public class InviteController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StreamRepository streamRepository;

    @Autowired
    private StreamInviteRepository inviteRepository;

    @GetMapping("/me")
    public List<StreamInvite> getMyPendingInvites() {
        User user = getCurrentUser();
        if (user == null) return List.of();
        return inviteRepository.findByInviteeIdAndStatus(user.getId(), StreamInvite.InviteStatus.PENDING);
    }

    @PostMapping("/stream/{streamId}/user/{userId}")
    public ResponseEntity<?> sendInvite(@PathVariable Long streamId, @PathVariable Long userId) {
        User currentUser = getCurrentUser();
        Optional<Stream> streamOpt = streamRepository.findById(streamId);
        Optional<User> userToInviteOpt = userRepository.findById(userId);

        if (currentUser == null || streamOpt.isEmpty() || userToInviteOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Stream stream = streamOpt.get();
        User invitedUser = userToInviteOpt.get();

        // Check if already a member
        if (stream.getMembers().contains(invitedUser)) {
            return ResponseEntity.badRequest().body("Usuário já é membro deste grupo.");
        }

        // Check if invite already exists
        Optional<StreamInvite> existing = inviteRepository.findByStreamIdAndInviteeIdAndStatus(streamId, userId, StreamInvite.InviteStatus.PENDING);
        if (existing.isPresent()) {
            return ResponseEntity.badRequest().body("Convite já enviado para este usuário.");
        }

        StreamInvite invite = StreamInvite.builder()
                .stream(stream)
                .inviter(currentUser)
                .invitee(invitedUser)
                .status(StreamInvite.InviteStatus.PENDING)
                .build();
        
        StreamInvite savedInvite = inviteRepository.save(invite);

        Map<String, Object> wsMessage = new HashMap<>();
        wsMessage.put("type", "STREAM_INVITE");
        wsMessage.put("inviteId", savedInvite.getId());
        wsMessage.put("streamId", stream.getId());
        wsMessage.put("streamName", stream.getName());
        wsMessage.put("senderName", currentUser.getDisplayName() != null ? currentUser.getDisplayName() : currentUser.getUsername());
        wsMessage.put("senderId", currentUser.getId());

        messagingTemplate.convertAndSend("/topic/user/" + invitedUser.getId(), (Object) wsMessage);

        return ResponseEntity.ok(savedInvite);
    }

    @PostMapping("/{inviteId}/accept")
    public ResponseEntity<?> acceptInvite(@PathVariable Long inviteId) {
        User user = getCurrentUser();
        Optional<StreamInvite> inviteOpt = inviteRepository.findById(inviteId);

        if (user == null || inviteOpt.isEmpty()) return ResponseEntity.notFound().build();

        StreamInvite invite = inviteOpt.get();
        if (!invite.getInvitee().getId().equals(user.getId())) return ResponseEntity.status(403).build();

        Stream stream = invite.getStream();
        stream.getMembers().add(user);
        streamRepository.save(stream);

        invite.setStatus(StreamInvite.InviteStatus.ACCEPTED);
        inviteRepository.save(invite);

        return ResponseEntity.ok().build();
    }

    @PostMapping("/{inviteId}/decline")
    public ResponseEntity<?> declineInvite(@PathVariable Long inviteId) {
        User user = getCurrentUser();
        Optional<StreamInvite> inviteOpt = inviteRepository.findById(inviteId);

        if (user == null || inviteOpt.isEmpty()) return ResponseEntity.notFound().build();

        StreamInvite invite = inviteOpt.get();
        if (!invite.getInvitee().getId().equals(user.getId())) return ResponseEntity.status(403).build();

        invite.setStatus(StreamInvite.InviteStatus.DECLINED);
        inviteRepository.save(invite);

        return ResponseEntity.ok().build();
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) return null;
        return userRepository.findByUsername(authentication.getName()).orElse(null);
    }
}
