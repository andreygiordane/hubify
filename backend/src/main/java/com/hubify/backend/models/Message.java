package com.hubify.backend.models;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.LocalDateTime;

@Entity
@Table(name = "messages")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "stream_id")
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Stream stream;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "conversation_id")
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Conversation conversation;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "attachment_url", columnDefinition = "TEXT")
    private String attachmentUrl;

    private String attachmentName;

    private String attachmentType;

    @Column(name = "edited")
    @Builder.Default
    private Boolean edited = false;

    @Column(name = "deleted_for_all")
    @Builder.Default
    private Boolean deletedForAll = false;

    @ElementCollection
    @CollectionTable(name = "message_deleted_by", joinColumns = @JoinColumn(name = "message_id"))
    @Column(name = "user_id")
    @Builder.Default
    private java.util.Set<Long> deletedByUsers = new java.util.HashSet<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
