package com.docflow.backand.approval.web;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class CreateApprovalDecisionRequest {

    @NotNull
    private Long decidedById;

    @NotBlank
    private String decision;
    private String comment;

    public CreateApprovalDecisionRequest() {
    }

    public Long getDecidedById() {
        return decidedById;
    }

    public void setDecidedById(Long decidedById) {
        this.decidedById = decidedById;
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
