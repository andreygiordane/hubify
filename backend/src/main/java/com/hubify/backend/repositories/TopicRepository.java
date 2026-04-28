package com.hubify.backend.repositories;

import com.hubify.backend.models.Topic;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TopicRepository extends JpaRepository<Topic, Long> {
    List<Topic> findByStreamId(Long streamId);
    Optional<Topic> findByNameAndStreamId(String name, Long streamId);
}
