package com.hubify.backend.controllers;

import com.hubify.backend.models.Stream;
import com.hubify.backend.repositories.StreamRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/streams")
public class StreamController {

    @Autowired
    private StreamRepository streamRepository;

    @GetMapping
    public List<Stream> getAllStreams() {
        return streamRepository.findAll();
    }

    @PostMapping
    public ResponseEntity<Stream> createStream(@RequestBody Stream stream) {
        if (streamRepository.findByName(stream.getName()).isPresent()) {
            return ResponseEntity.badRequest().build();
        }
        Stream savedStream = streamRepository.save(stream);
        return ResponseEntity.ok(savedStream);
    }
}
