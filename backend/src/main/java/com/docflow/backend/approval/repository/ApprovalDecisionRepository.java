package com.docflow.backend.approval.repository;

import java.util.List;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import com.docflow.backend.approval.domain.ApprovalDecision;

public interface ApprovalDecisionRepository extends JpaRepository<ApprovalDecision, Long> {

    // Loads who decided in the same query, for their name in the response.
    @EntityGraph(attributePaths = "decidedBy")
    List<ApprovalDecision> findAllByDocumentIdOrderByDecidedAtAsc(Long documentId);
}
