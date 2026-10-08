package com.docflow.backend.document.domain;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayNameGeneration;
import org.junit.jupiter.api.DisplayNameGenerator;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.EnumSource;

// Plain unit test: no Spring, no database.
@DisplayNameGeneration(DisplayNameGenerator.ReplaceUnderscores.class)
class DocumentStatusTest {

    @Test
    void a_draft_can_be_submitted_for_review() {
        assertThat(DocumentStatus.DRAFT.canTransitionTo(DocumentStatus.IN_REVIEW)).isTrue();
    }

    @ParameterizedTest(name = "a draft cannot go directly to {0}")
    @EnumSource(value = DocumentStatus.class, names = { "DRAFT", "APPROVED", "REJECTED" })
    void a_draft_cannot_go_anywhere_except_in_review(DocumentStatus target) {
        assertThat(DocumentStatus.DRAFT.canTransitionTo(target)).isFalse();
    }

    @ParameterizedTest(name = "a document in review cannot be set to {0} (only a decision can change it)")
    @EnumSource(DocumentStatus.class)
    void a_document_in_review_cannot_change_status_directly(DocumentStatus target) {
        assertThat(DocumentStatus.IN_REVIEW.canTransitionTo(target)).isFalse();
    }

    @ParameterizedTest(name = "{0} is final and cannot change to {1}")
    @CsvSource({
            "APPROVED, DRAFT", "APPROVED, IN_REVIEW", "APPROVED, APPROVED", "APPROVED, REJECTED",
            "REJECTED, DRAFT", "REJECTED, IN_REVIEW", "REJECTED, APPROVED", "REJECTED, REJECTED",
    })
    void approved_and_rejected_are_final(DocumentStatus from, DocumentStatus to) {
        assertThat(from.canTransitionTo(to)).isFalse();
    }
}
