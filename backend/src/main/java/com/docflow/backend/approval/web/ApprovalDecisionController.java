package com.docflow.backend.approval.web;

import java.util.List;

import jakarta.validation.Valid;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.docflow.backend.approval.domain.ApprovalDecision;
import com.docflow.backend.approval.service.ApprovalDecisionService;
import com.docflow.backend.security.UserPrincipal;

@RestController
public class ApprovalDecisionController {

    private final ApprovalDecisionService approvalDecisionService;

    public ApprovalDecisionController(ApprovalDecisionService approvalDecisionService) {
        this.approvalDecisionService = approvalDecisionService;
    }

    @GetMapping("/api/documents/{documentId}/decisions")
    public List<ApprovalDecisionResponse> getApprovalDecisions(@PathVariable Long documentId) {
        return approvalDecisionService.getDecisionsByDocumentId(documentId).stream()
                .map(this::toApprovalDecisionResponse)
                .toList();
    }

    @PostMapping("/api/documents/{documentId}/decisions")
    public ApprovalDecisionResponse createApprovalDecision(
            @PathVariable Long documentId,
            @Valid @RequestBody CreateApprovalDecisionRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        ApprovalDecision approvalDecision = approvalDecisionService.createDecision(
                documentId,
                currentUser.getUser().getId(),
                request.getDecision(),
                request.getComment());

        return toApprovalDecisionResponse(approvalDecision);
    }

    private ApprovalDecisionResponse toApprovalDecisionResponse(ApprovalDecision approvalDecision) {
        ApprovalDecisionResponse response = new ApprovalDecisionResponse();
        response.setId(approvalDecision.getId());
        response.setDocumentId(approvalDecision.getDocument().getId());
        response.setDecidedById(approvalDecision.getDecidedBy().getId());
        response.setDecidedByName(approvalDecision.getDecidedBy().getFullName());
        response.setDecision(approvalDecision.getDecision().name());
        response.setComment(approvalDecision.getComment());
        response.setDecidedAt(approvalDecision.getDecidedAt());
        return response;
    }
}
