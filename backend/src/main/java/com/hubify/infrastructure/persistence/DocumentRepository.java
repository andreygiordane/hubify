package com.hubify.infrastructure.persistence;
import com.hubify.domain.model.DocumentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface DocumentRepository extends JpaRepository<DocumentEntity, String> {
    List<DocumentEntity> findByCollectionName(String collectionName);
}
