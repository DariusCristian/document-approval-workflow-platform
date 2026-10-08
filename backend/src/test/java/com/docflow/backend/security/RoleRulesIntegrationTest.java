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
import org.springframework.test.web.servlet.ResultActions;

import com.docflow.backend.document.domain.Document;
import com.docflow.backend.document.domain.DocumentStatus;
import com.docflow.backend.document.repository.DocumentRepository;
import com.docflow.backend.support.IntegrationTest;
import com.docflow.backend.user.domain.User;
import com.docflow.backend.user.domain.UserRole;
import com.docflow.backend.user.repository.UserRepository;

class RoleRulesIntegrationTest extends IntegrationTest {

    @Autowired
    private DocumentRepository documentRepository;

    @Autowired
    private UserRepository userRepository;

    @Test
    void author_cannot_approve_a_document() throws Exception {
        User author = testData.user(UserRole.AUTHOR);
        Document document = testData.document(testData.user(UserRole.AUTHOR), DocumentStatus.IN_REVIEW);

        decide(author, document, "APPROVE")
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.message").value("Only reviewers and admins can approve or reject documents."));

        assertStatus(document, DocumentStatus.IN_REVIEW);
    }

    @Test
    void reviewer_cannot_decide_on_their_own_document() throws Exception {
        User reviewer = testData.user(UserRole.REVIEWER);
        Document document = testData.document(reviewer, DocumentStatus.IN_REVIEW);

        decide(reviewer, document, "APPROVE")
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("You cannot approve or reject your own document."));

        assertStatus(document, DocumentStatus.IN_REVIEW);
    }

    @Test
    void admin_cannot_decide_on_their_own_document() throws Exception {
        User admin = testData.user(UserRole.ADMIN);
        Document document = testData.document(admin, DocumentStatus.IN_REVIEW);

        decide(admin, document, "REJECT")
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("You cannot approve or reject your own document."));

        assertStatus(document, DocumentStatus.IN_REVIEW);
    }

    @Test
    void reviewer_can_decide_on_someone_elses_document_in_review() throws Exception {
        User reviewer = testData.user(UserRole.REVIEWER);
        Document document = testData.document(testData.user(UserRole.AUTHOR), DocumentStatus.IN_REVIEW);

        decide(reviewer, document, "APPROVE")
                .andExpect(status().isOk());

        assertStatus(document, DocumentStatus.APPROVED);
    }

    @Test
    void admin_can_decide_on_someone_elses_document_in_review() throws Exception {
        User admin = testData.user(UserRole.ADMIN);
        Document document = testData.document(testData.user(UserRole.REVIEWER), DocumentStatus.IN_REVIEW);

        decide(admin, document, "REJECT")
                .andExpect(status().isOk());

        assertStatus(document, DocumentStatus.REJECTED);
    }

    @Test
    void admin_can_create_a_user_who_can_then_log_in() throws Exception {
        User admin = testData.user(UserRole.ADMIN);

        createUser(admin, "new.reviewer@test.local")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("new.reviewer@test.local"))
                .andExpect(jsonPath("$.roleName").value("REVIEWER"))
                .andExpect(jsonPath("$.password").doesNotExist())
                .andExpect(jsonPath("$.passwordHash").doesNotExist());

        mockMvc.perform(post("/api/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email": "new.reviewer@test.local", "password": "secret-password"}
                                """))
                .andExpect(status().isOk());
    }

    @Test
    void reviewer_cannot_create_users() throws Exception {
        User reviewer = testData.user(UserRole.REVIEWER);

        createUser(reviewer, "sneaky@test.local")
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Only admins can create users."));

        assertThat(userRepository.findByEmail("sneaky@test.local")).isEmpty();
    }

    @Test
    void author_cannot_create_users() throws Exception {
        User author = testData.user(UserRole.AUTHOR);

        createUser(author, "sneaky@test.local")
                .andExpect(status().isForbidden());

        assertThat(userRepository.findByEmail("sneaky@test.local")).isEmpty();
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

    private ResultActions createUser(User currentUser, String email) throws Exception {
        return mockMvc.perform(post("/api/users")
                .with(loggedInAs(currentUser))
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"email": "%s", "fullName": "New Person", "roleName": "REVIEWER", "password": "secret-password"}
                        """.formatted(email)));
    }

    private void assertStatus(Document document, DocumentStatus expected) {
        assertThat(documentRepository.findById(document.getId()).orElseThrow().getStatus()).isEqualTo(expected);
    }
}
