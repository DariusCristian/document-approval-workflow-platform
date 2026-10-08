package com.docflow.backend.document.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.docflow.backend.document.domain.Document;

public interface DocumentRepository extends JpaRepository<Document, Long> {

    List<Document> findAllByCreatedById(Long createdById);

    // Loads the author in the same query, so the response can include the author's name.
    // Newest first; the id breaks ties between documents created in the same instant.
    @EntityGraph(attributePaths = "createdBy")
    List<Document> findAllByOrderByCreatedAtDescIdDesc();

    @EntityGraph(attributePaths = "createdBy")
    Optional<Document> findWithCreatorById(Long id);
}
