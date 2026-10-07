package com.docflow.backand.approval.web;

import jakarta.validation.constraints.NotBlank;

public class CreateApprovalDecisionRequest {

    @NotBlank
    private String decision;
    private String comment;

    public CreateApprovalDecisionRequest() {
    }

    public String getDecision() {
        return decision;
    }

    public void setDecision(String decision) {
        this.decision = decision;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }
}
