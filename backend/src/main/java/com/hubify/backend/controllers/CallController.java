package com.hubify.backend.controllers;

import com.hubify.backend.models.Conversation;
import com.hubify.backend.models.Stream;
import com.hubify.backend.models.User;
import com.hubify.backend.payload.request.CallEventRequest;
import com.hubify.backend.payload.response.CallEventResponse;
import com.hubify.backend.repositories.ConversationRepository;
import com.hubify.backend.repositories.StreamRepository;
import com.hubify.backend.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/calls")
public class CallController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private StreamRepository streamRepository;

    @Autowired
    private ConversationRepository conversationRepository;

    @PostMapping("/events")
    public ResponseEntity<CallEventResponse> broadcastEvent(@RequestBody CallEventRequest request) {
        User currentUser = getCurrentUser();
        if (currentUser == null || !StringUtils.hasText(request.getEventType())) {
            return ResponseEntity.badRequest().build();
        }

        String eventType = request.getEventType().trim().toUpperCase();
        CallEventResponse response = new CallEventResponse(
                LocalDateTime.now(),
                request.getStreamId(),
                request.getConversationId(),
                StringUtils.hasText(request.getCallId()) ? request.getCallId().trim() : null,
                eventType,
                StringUtils.hasText(request.getMode()) ? request.getMode().trim() : null,
                StringUtils.hasText(request.getMessage()) ? request.getMessage().trim() : null,
                request.getPayload(),
                request.getHandRaised(),
                request.getScreenSharing(),
                currentUser.getId(),
                currentUser.getUsername(),
                currentUser.getDisplayName(),
                currentUser.getAvatarUrl(),
                currentUser.getStatus() != null ? currentUser.getStatus().name() : "OFFLINE",
                request.getTargetUserId());

        // Route to the correct topic
        if (request.getConversationId() != null) {
            // Private conversation — broadcast to the shared channel
            messagingTemplate.convertAndSend("/topic/conversations/" + request.getConversationId(), (Object) response);

            if ("INVITE".equals(eventType)) {
                Conversation conv = conversationRepository.findById(request.getConversationId()).orElse(null);
                if (conv != null) {
                    conv.getParticipants().forEach(participant -> {
                        if (!participant.getId().equals(currentUser.getId())) {
                            messagingTemplate.convertAndSend("/topic/user/" + participant.getId(), (Object) response);
                        }
                    });
                }
            }
        } else if (request.getStreamId() != null) {
            messagingTemplate.convertAndSend("/topic/stream/" + request.getStreamId(), (Object) response);
            if ("INVITE".equals(eventType)) {
                Stream stream = streamRepository.findById(request.getStreamId()).orElse(null);
                if (stream != null) {
                    stream.getMembers().forEach(member -> {
                        if (!member.getId().equals(currentUser.getId())) {
                            messagingTemplate.convertAndSend("/topic/user/" + member.getId(), (Object) response);
                        }
                    });
                }
            }
        }

        return ResponseEntity.ok(response);
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) return null;
        return userRepository.findByUsername(authentication.getName()).orElse(null);
    }
}