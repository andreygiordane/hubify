package com.hubify.backend.repositories;

import com.hubify.backend.models.Message;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {
    List<Message> findByStreamIdAndTopicIdOrderByCreatedAtAsc(Long streamId, Long topicId);
    List<Message> findByStreamIdOrderByCreatedAtAsc(Long streamId);
}
