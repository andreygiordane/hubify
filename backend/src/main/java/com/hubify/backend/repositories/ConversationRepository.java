package com.hubify.backend.repositories;

import com.hubify.backend.models.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {
    @Query("SELECT c FROM Conversation c JOIN c.participants p WHERE p.id = :userId")
    List<Conversation> findByParticipantId(@Param("userId") Long userId);

    @Query("SELECT c FROM Conversation c JOIN c.participants p1 JOIN c.participants p2 WHERE p1.id = :u1Id AND p2.id = :u2Id")
    List<Conversation> findBetweenParticipants(@Param("u1Id") Long u1Id, @Param("u2Id") Long u2Id);
}
