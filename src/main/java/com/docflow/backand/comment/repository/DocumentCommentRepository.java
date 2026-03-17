package com.docflow.backand.comment.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.docflow.backand.comment.domain.DocumentComment;

public interface DocumentCommentRepository extends JpaRepository<DocumentComment, Long> {

    List<DocumentComment> findAllByDocumentIdOrderByCreatedAtAsc(Long documentId);
}
