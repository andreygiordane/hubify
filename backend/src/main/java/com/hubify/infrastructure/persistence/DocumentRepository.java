package com.hubify.infrastructure.persistence;
import com.hubify.domain.model.DocumentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface DocumentRepository extends JpaRepository<DocumentEntity, String> {
    List<DocumentEntity> findByCollectionName(String collectionName);

    @org.springframework.data.jpa.repository.Query(value = "SELECT * FROM documents WHERE collection_name = ?1 AND json_data LIKE CONCAT('%', ?2, '%')", nativeQuery = true)
    List<DocumentEntity> findByCollectionAndJsonId(String collection, String id);
}
