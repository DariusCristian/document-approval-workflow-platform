package com.docflow.backand.approval.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.docflow.backand.approval.domain.ApprovalDecision;
import com.docflow.backand.approval.domain.ApprovalDecisionType;
import com.docflow.backand.approval.repository.ApprovalDecisionRepository;
import com.docflow.backand.common.exception.ForbiddenException;
import com.docflow.backand.document.domain.Document;
import com.docflow.backand.document.domain.DocumentStatus;
import com.docflow.backand.document.repository.DocumentRepository;
import com.docflow.backand.user.domain.User;
import com.docflow.backand.user.domain.UserRole;
import com.docflow.backand.user.repository.UserRepository;

@Service
public class ApprovalDecisionService {

    private final ApprovalDecisionRepository approvalDecisionRepository;
    private final DocumentRepository documentRepository;
    private final UserRepository userRepository;

    public ApprovalDecisionService(
            ApprovalDecisionRepository approvalDecisionRepository,
            DocumentRepository documentRepository,
            UserRepository userRepository) {
        this.approvalDecisionRepository = approvalDecisionRepository;
        this.documentRepository = documentRepository;
        this.userRepository = userRepository;
    }

    public ApprovalDecision createDecision(Long documentId, Long decidedById, String decision, String comment) {
        User decidedBy = userRepository.findById(decidedById)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + decidedById));

        if (decidedBy.getRole() != UserRole.REVIEWER && decidedBy.getRole() != UserRole.ADMIN) {
            throw new ForbiddenException("Only reviewers and admins can approve or reject documents.");
        }

        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found with id: " + documentId));

        // Four-eyes rule: nobody decides on their own document, not even an admin.
        if (document.getCreatedBy().getId().equals(decidedBy.getId())) {
            throw new ForbiddenException("You cannot approve or reject your own document.");
        }

        if (document.getStatus() != DocumentStatus.IN_REVIEW) {
            throw new IllegalArgumentException(
                    "Cannot decide document with status: " + document.getStatus() + ". Expected IN_REVIEW.");
        }

        ApprovalDecisionType decisionType = parseDecisionType(decision);
        ApprovalDecision approvalDecision = new ApprovalDecision(document, decidedBy, decisionType, comment);
        ApprovalDecision savedDecision = approvalDecisionRepository.save(approvalDecision);

        if (decisionType == ApprovalDecisionType.APPROVE) {
            document.setStatus(DocumentStatus.APPROVED);
        } else {
            document.setStatus(DocumentStatus.REJECTED);
        }
        documentRepository.save(document);

        return savedDecision;
    }

    public List<ApprovalDecision> getDecisionsByDocumentId(Long documentId) {
        return approvalDecisionRepository.findAllByDocumentIdOrderByDecidedAtAsc(documentId);
    }

    private ApprovalDecisionType parseDecisionType(String decision) {
        if (decision == null || decision.isBlank()) {
            throw new IllegalArgumentException("Invalid approval decision type: " + decision);
        }

        try {
            return ApprovalDecisionType.valueOf(decision.trim().toUpperCase());
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException("Invalid approval decision type: " + decision);
        }
    }
}
