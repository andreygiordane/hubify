package com.hubify.backend.repositories;

import com.hubify.backend.models.Stream;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StreamRepository extends JpaRepository<Stream, Long> {
    Optional<Stream> findByName(String name);
    List<Stream> findByMembersId(Long userId);
}
