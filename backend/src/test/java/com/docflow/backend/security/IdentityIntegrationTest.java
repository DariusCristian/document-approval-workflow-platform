package com.docflow.backend.security;

import static com.docflow.backend.support.TestData.loggedInAs;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import com.docflow.backend.approval.repository.ApprovalDecisionRepository;
import com.docflow.backend.comment.repository.DocumentCommentRepository;
import com.docflow.backend.document.domain.Document;
import com.docflow.backend.document.domain.DocumentStatus;
import com.docflow.backend.document.repository.DocumentRepository;
import com.docflow.backend.support.IntegrationTest;
import com.docflow.backend.user.domain.User;
import com.docflow.backend.user.domain.UserRole;

// The server takes "who is doing this" from the session; user ids in the request body are ignored.
class IdentityIntegrationTest extends IntegrationTest {

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private DocumentCommentRepository documentCommentRepository;

    @Autowired
    private ApprovalDecisionRepository approvalDecisionRepository;

    @Test
    void a_fake_createdById_is_ignored_and_the_logged_in_user_becomes_the_author() throws Exception {
        User author = testData.user(UserRole.AUTHOR);
        User someoneElse = testData.user(UserRole.ADMIN);

        mockMvc.perform(post("/api/documents")
                        .with(loggedInAs(author))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title": "Policy", "content": "Text", "createdById": %d}
                                """.formatted(someoneElse.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.createdById").value(author.getId()));

        assertThat(documentRepository.findAllByCreatedById(author.getId())).hasSize(1);
        assertThat(documentRepository.findAllByCreatedById(someoneElse.getId())).isEmpty();
    }

    @Test
    void a_fake_authorId_on_a_comment_is_ignored() throws Exception {
        User commenter = testData.user(UserRole.AUTHOR);
        User someoneElse = testData.user(UserRole.REVIEWER);
        Document document = testData.document(commenter, DocumentStatus.DRAFT);

        mockMvc.perform(post("/api/documents/{id}/comments", document.getId())
                        .with(loggedInAs(commenter))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"content": "Looks good", "authorId": %d}
                                """.formatted(someoneElse.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.authorId").value(commenter.getId()));

        assertThat(documentCommentRepository.findAllByDocumentIdOrderByCreatedAtAsc(document.getId()))
                .singleElement()
                .satisfies(comment -> assertThat(comment.getAuthor().getId()).isEqualTo(commenter.getId()));
    }

    @Test
    void a_fake_decidedById_on_a_decision_is_ignored() throws Exception {
        User author = testData.user(UserRole.AUTHOR);
        User reviewer = testData.user(UserRole.REVIEWER);
        User admin = testData.user(UserRole.ADMIN);
        Document document = testData.document(author, DocumentStatus.IN_REVIEW);

        mockMvc.perform(post("/api/documents/{id}/decisions", document.getId())
                        .with(loggedInAs(reviewer))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"decision": "APPROVE", "decidedById": %d}
                                """.formatted(admin.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.decidedById").value(reviewer.getId()));

        assertThat(approvalDecisionRepository.findAllByDocumentIdOrderByDecidedAtAsc(document.getId()))
                .singleElement()
                .satisfies(decision -> assertThat(decision.getDecidedBy().getId()).isEqualTo(reviewer.getId()));
    }

    @Test
    void an_author_cannot_approve_by_sending_a_reviewers_id_as_decidedById() throws Exception {
        User author = testData.user(UserRole.AUTHOR);
        User otherAuthor = testData.user(UserRole.AUTHOR);
        User reviewer = testData.user(UserRole.REVIEWER);
        Document document = testData.document(otherAuthor, DocumentStatus.IN_REVIEW);

        mockMvc.perform(post("/api/documents/{id}/decisions", document.getId())
                        .with(loggedInAs(author))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"decision": "APPROVE", "decidedById": %d}
                                """.formatted(reviewer.getId())))
                .andExpect(status().isForbidden());

        assertThat(approvalDecisionRepository.count()).isZero();
    }
}
