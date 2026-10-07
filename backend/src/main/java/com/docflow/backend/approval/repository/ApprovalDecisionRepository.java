package com.docflow.backend.approval.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.docflow.backend.approval.domain.ApprovalDecision;

public interface ApprovalDecisionRepository extends JpaRepository<ApprovalDecision, Long> {

    List<ApprovalDecision> findAllByDocumentIdOrderByDecidedAtAsc(Long documentId);
}
