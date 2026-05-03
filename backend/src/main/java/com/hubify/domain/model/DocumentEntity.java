package com.hubify.domain.model;
import jakarta.persistence.*;
import lombok.Data;
@Entity
@Table(name = "documents")
@Data
public class DocumentEntity {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private String id;
    private String collectionName;
    @Column(columnDefinition = "TEXT") private String jsonData;
}
