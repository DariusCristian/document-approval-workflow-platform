package com.docflow.backend.document;

import static com.docflow.backend.support.TestData.loggedInAs;
import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.ResultActions;

import com.docflow.backend.approval.repository.ApprovalDecisionRepository;
import com.docflow.backend.document.domain.Document;
import com.docflow.backend.document.domain.DocumentStatus;
import com.docflow.backend.document.repository.DocumentRepository;
import com.docflow.backend.support.IntegrationTest;
import com.docflow.backend.user.domain.User;
import com.docflow.backend.user.domain.UserRole;

class WorkflowIntegrationTest extends IntegrationTest {

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private ApprovalDecisionRepository approvalDecisionRepository;

    @Test
    void a_new_document_starts_as_draft() throws Exception {
        User author = testData.user(UserRole.AUTHOR);

        mockMvc.perform(post("/api/documents")
                        .with(loggedInAs(author))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title": "Policy", "content": "Text", "status": "APPROVED"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DRAFT"));
    }

    @Test
    void author_can_submit_their_draft_for_review() throws Exception {
        User author = testData.user(UserRole.AUTHOR);
        Document document = testData.document(author, DocumentStatus.DRAFT);

        changeStatus(author, document, "IN_REVIEW")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("IN_REVIEW"));

        assertStatus(document, DocumentStatus.IN_REVIEW);
    }

    @ParameterizedTest(name = "a {0} cannot submit someone else's draft for review")
    @EnumSource(UserRole.class)
    void only_the_author_can_submit_a_draft_for_review(UserRole role) throws Exception {
        User otherUser = testData.user(role);
        Document document = testData.document(testData.user(UserRole.AUTHOR), DocumentStatus.DRAFT);

        changeStatus(otherUser, document, "IN_REVIEW")
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Only the author can submit this document for review."));

        assertStatus(document, DocumentStatus.DRAFT);
    }

    @ParameterizedTest(name = "setting the status to {0} through PATCH is rejected with 400")
    @ValueSource(strings = { "APPROVED", "REJECTED" })
    void approved_and_rejected_cannot_be_set_through_the_status_endpoint(String newStatus) throws Exception {
        User author = testData.user(UserRole.AUTHOR);
        Document draft = testData.document(author, DocumentStatus.DRAFT);
        Document inReview = testData.document(author, DocumentStatus.IN_REVIEW);

        changeStatus(author, draft, newStatus)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400));
        changeStatus(author, inReview, newStatus)
                .andExpect(status().isBadRequest());

        assertStatus(draft, DocumentStatus.DRAFT);
        assertStatus(inReview, DocumentStatus.IN_REVIEW);
    }

    @Test
    void a_document_in_review_cannot_go_back_to_draft() throws Exception {
        User author = testData.user(UserRole.AUTHOR);
        Document document = testData.document(author, DocumentStatus.IN_REVIEW);

        changeStatus(author, document, "DRAFT")
                .andExpect(status().isBadRequest());
    }

    @Test
    void an_unknown_status_is_rejected_with_400() throws Exception {
        User author = testData.user(UserRole.AUTHOR);
        Document document = testData.document(author, DocumentStatus.DRAFT);

        changeStatus(author, document, "PUBLISHED")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invalid document status: PUBLISHED"));
    }

    @ParameterizedTest(name = "deciding on a {0} document is rejected with 400")
    @EnumSource(value = DocumentStatus.class, names = { "DRAFT", "APPROVED", "REJECTED" })
    void deciding_on_a_document_that_is_not_in_review_is_rejected_with_400(DocumentStatus documentStatus)
            throws Exception {
        User reviewer = testData.user(UserRole.REVIEWER);
        Document document = testData.document(testData.user(UserRole.AUTHOR), documentStatus);

        decide(reviewer, document, "APPROVE", null)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message")
                        .value("Cannot decide document with status: " + documentStatus + ". Expected IN_REVIEW."));

        assertStatus(document, documentStatus);
        assertThat(approvalDecisionRepository.count()).isZero();
    }

    @Test
    void an_unknown_decision_type_is_rejected_with_400() throws Exception {
        User reviewer = testData.user(UserRole.REVIEWER);
        Document document = testData.document(testData.user(UserRole.AUTHOR), DocumentStatus.IN_REVIEW);

        decide(reviewer, document, "MAYBE", null)
                .andExpect(status().isBadRequest());

        assertStatus(document, DocumentStatus.IN_REVIEW);
        assertThat(approvalDecisionRepository.count()).isZero();
    }

    @Test
    void approving_sets_the_status_to_approved_and_shows_up_in_the_history() throws Exception {
        User reviewer = testData.user(UserRole.REVIEWER, "Rita Reviewer");
        Document document = testData.document(testData.user(UserRole.AUTHOR), DocumentStatus.IN_REVIEW);

        decide(reviewer, document, "APPROVE", "Clear and complete.")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.decision").value("APPROVE"));

        mockMvc.perform(get("/api/documents/{id}", document.getId()).with(loggedInAs(reviewer)))
                .andExpect(jsonPath("$.status").value("APPROVED"));
        mockMvc.perform(get("/api/documents/{id}/decisions", document.getId()).with(loggedInAs(reviewer)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].decision").value("APPROVE"))
                .andExpect(jsonPath("$[0].decidedById").value(reviewer.getId()))
                .andExpect(jsonPath("$[0].decidedByName").value("Rita Reviewer"))
                .andExpect(jsonPath("$[0].comment").value("Clear and complete."));
    }

    @Test
    void rejecting_sets_the_status_to_rejected_and_shows_up_in_the_history() throws Exception {
        User admin = testData.user(UserRole.ADMIN, "Alice Admin");
        Document document = testData.document(testData.user(UserRole.AUTHOR), DocumentStatus.IN_REVIEW);

        decide(admin, document, "REJECT", "Costs are not justified.")
                .andExpect(status().isOk());

        assertStatus(document, DocumentStatus.REJECTED);
        mockMvc.perform(get("/api/documents/{id}/decisions", document.getId()).with(loggedInAs(admin)))
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].decision").value("REJECT"))
                .andExpect(jsonPath("$[0].decidedByName").value("Alice Admin"));
    }

    @Test
    void a_decided_document_cannot_be_decided_again() throws Exception {
        User reviewer = testData.user(UserRole.REVIEWER);
        User admin = testData.user(UserRole.ADMIN);
        Document document = testData.document(testData.user(UserRole.AUTHOR), DocumentStatus.IN_REVIEW);

        decide(reviewer, document, "APPROVE", null).andExpect(status().isOk());
        decide(admin, document, "REJECT", null).andExpect(status().isBadRequest());

        assertStatus(document, DocumentStatus.APPROVED);
        assertThat(approvalDecisionRepository.count()).isEqualTo(1);
    }

    @Test
    void the_full_workflow_from_draft_to_approved() throws Exception {
        User author = testData.user(UserRole.AUTHOR);
        User reviewer = testData.user(UserRole.REVIEWER);
        Document document = testData.document(author, DocumentStatus.DRAFT);

        decide(reviewer, document, "APPROVE", null).andExpect(status().isBadRequest());
        changeStatus(author, document, "IN_REVIEW").andExpect(status().isOk());
        decide(reviewer, document, "APPROVE", null).andExpect(status().isOk());

        assertStatus(document, DocumentStatus.APPROVED);
    }

    private ResultActions changeStatus(User user, Document document, String newStatus) throws Exception {
        return mockMvc.perform(patch("/api/documents/{id}/status", document.getId())
                .with(loggedInAs(user))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"status": "%s"}
                        """.formatted(newStatus)));
    }

    private ResultActions decide(User user, Document document, String decision, String comment) throws Exception {
        String commentJson = comment == null ? "null" : "\"" + comment + "\"";
        return mockMvc.perform(post("/api/documents/{id}/decisions", document.getId())
                .with(loggedInAs(user))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"decision": "%s", "comment": %s}
                        """.formatted(decision, commentJson)));
    }

    private void assertStatus(Document document, DocumentStatus expected) {
        assertThat(documentRepository.findById(document.getId()).orElseThrow().getStatus()).isEqualTo(expected);
    }
}
