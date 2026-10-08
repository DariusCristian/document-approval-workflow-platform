package com.docflow.backend.comment.repository;

import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.docflow.backend.comment.domain.DocumentComment;

public interface DocumentCommentRepository extends JpaRepository<DocumentComment, Long> {

    // Loads each comment's author in the same query, for the author's name in the response.
    @EntityGraph(attributePaths = "author")
    List<DocumentComment> findAllByDocumentIdOrderByCreatedAtAsc(Long documentId);
}
