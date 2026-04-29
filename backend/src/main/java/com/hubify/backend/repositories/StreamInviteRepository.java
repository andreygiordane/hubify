package com.hubify.backend.repositories;

import com.hubify.backend.models.StreamInvite;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface StreamInviteRepository extends JpaRepository<StreamInvite, Long> {
    List<StreamInvite> findByInviteeIdAndStatus(Long inviteeId, StreamInvite.InviteStatus status);
    Optional<StreamInvite> findByStreamIdAndInviteeIdAndStatus(Long streamId, Long inviteeId, StreamInvite.InviteStatus status);
    List<StreamInvite> findByStreamId(Long streamId);
}
