package com.hubify.backend.controllers;

import com.hubify.backend.models.Message;
import com.hubify.backend.models.Stream;
import com.hubify.backend.models.Topic;
import com.hubify.backend.models.User;
import com.hubify.backend.payload.request.MessageRequest;
import com.hubify.backend.repositories.MessageRepository;
import com.hubify.backend.repositories.StreamRepository;
import com.hubify.backend.repositories.TopicRepository;
import com.hubify.backend.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/messages")
public class MessageController {

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private StreamRepository streamRepository;

    @Autowired
    private TopicRepository topicRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @GetMapping
    public ResponseEntity<List<Message>> getMessages(
            @RequestParam Long streamId,
            @RequestParam(required = false) Long topicId) {
        
        if (topicId != null) {
            return ResponseEntity.ok(messageRepository.findByStreamIdAndTopicIdOrderByCreatedAtAsc(streamId, topicId));
        } else {
            return ResponseEntity.ok(messageRepository.findByStreamIdOrderByCreatedAtAsc(streamId));
        }
    }

    @PostMapping
    public ResponseEntity<Message> sendMessage(@RequestBody MessageRequest request) {
        User sender = userRepository.findById(request.getSenderId()).orElse(null);
        Stream stream = streamRepository.findById(request.getStreamId()).orElse(null);
        Topic topic = topicRepository.findById(request.getTopicId()).orElse(null);

        if (sender == null || stream == null || topic == null) {
            return ResponseEntity.badRequest().build();
        }

        Message message = new Message();
        message.setContent(request.getContent());
        message.setSender(sender);
        message.setStream(stream);
        message.setTopic(topic);

        Message savedMessage = messageRepository.save(message);

        // Broadcast the message via WebSocket
        messagingTemplate.convertAndSend("/topic/stream/" + stream.getId(), savedMessage);

        return ResponseEntity.ok(savedMessage);
    }
}
