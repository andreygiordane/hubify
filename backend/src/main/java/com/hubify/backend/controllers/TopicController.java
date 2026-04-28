package com.hubify.backend.controllers;

import com.hubify.backend.models.Stream;
import com.hubify.backend.models.Topic;
import com.hubify.backend.repositories.StreamRepository;
import com.hubify.backend.repositories.TopicRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/streams/{streamId}/topics")
public class TopicController {

    @Autowired
    private TopicRepository topicRepository;

    @Autowired
    private StreamRepository streamRepository;

    @GetMapping
    public ResponseEntity<List<Topic>> getTopicsByStream(@PathVariable Long streamId) {
        if (!streamRepository.existsById(streamId)) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(topicRepository.findByStreamId(streamId));
    }

    @PostMapping
    public ResponseEntity<Topic> createTopic(@PathVariable Long streamId, @RequestBody Topic topicRequest) {
        Optional<Stream> streamOptional = streamRepository.findById(streamId);
        if (streamOptional.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        if (topicRepository.findByNameAndStreamId(topicRequest.getName(), streamId).isPresent()) {
            return ResponseEntity.badRequest().build();
        }

        Topic topic = new Topic();
        topic.setName(topicRequest.getName());
        topic.setStream(streamOptional.get());

        return ResponseEntity.ok(topicRepository.save(topic));
    }
}
