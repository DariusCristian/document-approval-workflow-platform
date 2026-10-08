package com.docflow.backend.document.domain;

public enum DocumentStatus {
    DRAFT,
    IN_REVIEW,
    APPROVED,
    REJECTED;

    // The only change allowed through the status endpoint is DRAFT -> IN_REVIEW.
    // APPROVED and REJECTED are only reached through approval decisions.
    public boolean canTransitionTo(DocumentStatus newStatus) {
        return this == DRAFT && newStatus == IN_REVIEW;
    }
}
