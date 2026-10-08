package com.docflow.backend.approval;

import static com.docflow.backend.support.TestData.loggedInAs;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mockingDetails;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.springframework.test.web.servlet.ResultActions;

import com.docflow.backend.approval.repository.ApprovalDecisionRepository;
import com.docflow.backend.document.domain.Document;
import com.docflow.backend.document.domain.DocumentStatus;
import com.docflow.backend.document.repository.DocumentRepository;
import com.docflow.backend.support.IntegrationTest;
import com.docflow.backend.user.domain.User;
import com.docflow.backend.user.domain.UserRole;

// A decision and the document's new status are saved together or not at all,
// and two decisions on the same document can't both win.
// (The spy bean gives this class its own Spring context; it still uses the shared database container.)
class DecisionConsistencyIntegrationTest extends IntegrationTest {

    @MockitoSpyBean
    private ApprovalDecisionRepository approvalDecisionRepository;

    @Autowired
    private DocumentRepository documentRepository;

    @Test
    void a_decision_is_all_or_nothing_when_the_status_update_fails() throws Exception {
        User reviewer = testData.user(UserRole.REVIEWER);
        Document document = testData.document(testData.user(UserRole.AUTHOR), DocumentStatus.IN_REVIEW);
        // Make the database refuse any update of the document, i.e. the second half of a decision.
        jdbcTemplate.execute("""
                create or replace function refuse_document_update() returns trigger as $$
                begin
                    raise exception 'document updates are switched off for this test';
                end;
                $$ language plpgsql
                """);
        jdbcTemplate.execute("""
                create trigger refuse_document_update before update on document
                for each row execute function refuse_document_update()
                """);

        try {
            // MockMvc rethrows the server error; a real server would answer 500.
            assertThatThrownBy(() -> decide(reviewer, document, "APPROVE"))
                    .hasStackTraceContaining("document updates are switched off for this test");
        } finally {
            jdbcTemplate.execute("drop trigger refuse_document_update on document");
            jdbcTemplate.execute("drop function refuse_document_update()");
        }

        // The decision was rolled back together with the failed status change.
        assertThat(approvalDecisionRepository.count()).isZero();
        assertStatus(document, DocumentStatus.IN_REVIEW);
    }

    @Test
    void a_decision_on_a_document_that_changed_in_the_meantime_gets_409_and_only_one_decision_is_kept()
            throws Exception {
        User reviewer = testData.user(UserRole.REVIEWER);
        User admin = testData.user(UserRole.ADMIN);
        Document document = testData.document(testData.user(UserRole.AUTHOR), DocumentStatus.IN_REVIEW);

        // The reviewer's request has already read the document (still IN_REVIEW) and is about to save its decision.
        // At exactly that moment, the admin decides in another thread (= another request and transaction) and finishes.
        AtomicBoolean adminHasDecided = new AtomicBoolean();
        AtomicInteger adminResponseStatus = new AtomicInteger();
        doAnswer(invocation -> {
            if (adminHasDecided.compareAndSet(false, true)) {
                CompletableFuture.runAsync(() -> adminResponseStatus.set(decideQuietly(admin, document, "APPROVE")))
                        .join();
            }
            // The repository is an interface proxy, so "call the real method" means using the spy's default answer,
            // which forwards the call to the real repository.
            return mockingDetails(approvalDecisionRepository).getMockCreationSettings().getDefaultAnswer()
                    .answer(invocation);
        }).when(approvalDecisionRepository).save(any());

        decide(reviewer, document, "REJECT")
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message")
                        .value("This document was just updated by someone else. Please reload and try again."));

        assertThat(adminResponseStatus.get()).isEqualTo(200);
        assertThat(approvalDecisionRepository.findAllByDocumentIdOrderByDecidedAtAsc(document.getId()))
                .singleElement()
                .satisfies(decision -> assertThat(decision.getDecidedBy().getId()).isEqualTo(admin.getId()));
        assertStatus(document, DocumentStatus.APPROVED);
    }

    private ResultActions decide(User user, Document document, String decision) throws Exception {
        return mockMvc.perform(post("/api/documents/{id}/decisions", document.getId())
                .with(loggedInAs(user))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"decision": "%s"}
                        """.formatted(decision)));
    }

    private int decideQuietly(User user, Document document, String decision) {
        try {
            return decide(user, document, decision).andReturn().getResponse().getStatus();
        } catch (Exception exception) {
            throw new IllegalStateException(exception);
        }
    }

    private void assertStatus(Document document, DocumentStatus expected) {
        assertThat(documentRepository.findById(document.getId()).orElseThrow().getStatus()).isEqualTo(expected);
    }
}
