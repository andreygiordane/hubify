package com.hubify.backend.controllers;

import com.hubify.backend.models.Conversation;
import com.hubify.backend.models.Message;
import com.hubify.backend.models.Stream;
import com.hubify.backend.models.User;
import com.hubify.backend.payload.request.MessageRequest;
import com.hubify.backend.repositories.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/messages")
public class MessageController {

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private StreamRepository streamRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ConversationRepository conversationRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @GetMapping
    public ResponseEntity<List<Message>> getMessages(
            @RequestParam(required = false) Long streamId,
            @RequestParam(required = false) Long conversationId) {
        
        User user = getCurrentUser();
        List<Message> messages;

        if (conversationId != null) {
            messages = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);
        } else if (streamId != null) {
            messages = messageRepository.findByStreamIdOrderByCreatedAtAsc(streamId);
        } else {
            return ResponseEntity.badRequest().build();
        }

        // Filter out messages deleted for all or for the current user
        if (user != null) {
            final Long userId = user.getId();
            messages = messages.stream()
                    .filter(m -> m.getDeletedForAll() == null || !m.getDeletedForAll())
                    .filter(m -> m.getDeletedByUsers() == null || !m.getDeletedByUsers().contains(userId))
                    .toList();
        }

        return ResponseEntity.ok(messages);
    }

    // ── Edit message ─────────────────────────────────────────────────────────
    @PutMapping("/{id}")
    public ResponseEntity<?> editMessage(@PathVariable Long id, @RequestBody Map<String, String> body) {
        User user = getCurrentUser();
        Optional<Message> msgOpt = messageRepository.findById(id);
        if (msgOpt.isEmpty()) return ResponseEntity.notFound().build();

        Message msg = msgOpt.get();
        // Only the sender can edit
        if (!msg.getSender().getId().equals(user.getId())) return ResponseEntity.status(403).build();

        String newContent = body.getOrDefault("content", "").trim();
        if (newContent.isEmpty()) return ResponseEntity.badRequest().body("Content cannot be empty.");

        msg.setContent(newContent);
        msg.setEdited(true);
        Message saved = messageRepository.save(msg);

        // Broadcast the edit to the right topic
        String destination = resolveDestination(saved);
        if (destination != null) {
            Map<String, Object> event = new HashMap<>();
            event.put("type", "MESSAGE_EDITED");
            event.put("id", saved.getId());
            event.put("content", saved.getContent());
            event.put("edited", true);
            messagingTemplate.convertAndSend(destination, (Object) event);
        }

        return ResponseEntity.ok(saved);
    }

    // ── Delete message for everyone ──────────────────────────────────────────
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteMessage(@PathVariable Long id) {
        User user = getCurrentUser();
        Optional<Message> msgOpt = messageRepository.findById(id);
        if (msgOpt.isEmpty()) return ResponseEntity.notFound().build();

        Message msg = msgOpt.get();
        // Only the sender can delete for everyone
        if (!msg.getSender().getId().equals(user.getId())) return ResponseEntity.status(403).build();

        String destination = resolveDestination(msg);

        msg.setDeletedForAll(true);
        msg.setContent("Esta mensagem foi apagada.");
        messageRepository.save(msg);

        // Broadcast deletion event
        if (destination != null) {
            Map<String, Object> event = new HashMap<>();
            event.put("type", "MESSAGE_DELETED");
            event.put("id", id);
            messagingTemplate.convertAndSend(destination, (Object) event);
        }

        return ResponseEntity.ok().build();
    }

    // ── Send message ─────────────────────────────────────────────────────────
    @PostMapping
    public ResponseEntity<Message> sendMessage(@RequestBody MessageRequest request) {
        User sender = userRepository.findById(request.getSenderId()).orElse(null);
        if (sender == null) return ResponseEntity.badRequest().build();

        Message message = new Message();
        message.setSender(sender);
        message.setContent(StringUtils.hasText(request.getContent()) ? request.getContent().trim() : "");
        message.setAttachmentUrl(request.getAttachmentUrl());
        message.setAttachmentName(request.getAttachmentName());
        message.setAttachmentType(request.getAttachmentType());

        String destination;

        if (request.getConversationId() != null) {
            Conversation conv = conversationRepository.findById(request.getConversationId()).orElse(null);
            if (conv == null) return ResponseEntity.badRequest().build();
            
            if (conv.getDeletedByUsers() != null && !conv.getDeletedByUsers().isEmpty()) {
                conv.getDeletedByUsers().clear();
                conversationRepository.save(conv);
            }

            message.setConversation(conv);
            destination = "/topic/conversations/" + conv.getId();
        } else if (request.getStreamId() != null) {
            Stream stream = streamRepository.findById(request.getStreamId()).orElse(null);
            if (stream == null) return ResponseEntity.badRequest().build();
            message.setStream(stream);
            destination = "/topic/stream/" + stream.getId();
        } else {
            return ResponseEntity.badRequest().build();
        }

        Message savedMessage = messageRepository.save(message);
        messagingTemplate.convertAndSend(destination, savedMessage);

        if (savedMessage.getConversation() != null) {
            savedMessage.getConversation().getParticipants().forEach(u ->
                messagingTemplate.convertAndSend("/topic/user/" + u.getId() + "/notifications", savedMessage));
        } else if (savedMessage.getStream() != null) {
            savedMessage.getStream().getMembers().forEach(u ->
                messagingTemplate.convertAndSend("/topic/user/" + u.getId() + "/notifications", savedMessage));
        }

        return ResponseEntity.ok(savedMessage);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────
    private String resolveDestination(Message msg) {
        if (msg.getConversation() != null) return "/topic/conversations/" + msg.getConversation().getId();
        if (msg.getStream() != null)       return "/topic/stream/" + msg.getStream().getId();
        return null;
    }

    private User getCurrentUser() {
        org.springframework.security.core.Authentication auth =
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return null;
        return userRepository.findByUsername(auth.getName()).orElse(null);
    }
}
