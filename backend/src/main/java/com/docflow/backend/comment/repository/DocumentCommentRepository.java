package com.docflow.backend.comment.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.docflow.backend.comment.domain.DocumentComment;

public interface DocumentCommentRepository extends JpaRepository<DocumentComment, Long> {

    List<DocumentComment> findAllByDocumentIdOrderByCreatedAtAsc(Long documentId);
}
