package com.docflow.backend.common;

import static com.docflow.backend.support.TestData.loggedInAs;
import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDateTime;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import com.docflow.backend.document.domain.Document;
import com.docflow.backend.document.domain.DocumentStatus;
import com.docflow.backend.support.IntegrationTest;
import com.docflow.backend.user.domain.User;
import com.docflow.backend.user.domain.UserRole;

class ApiResponsesIntegrationTest extends IntegrationTest {

    @Test
    void a_document_includes_the_authors_name() throws Exception {
        User author = testData.user(UserRole.AUTHOR, "Adam Author");
        Document document = testData.document(author, DocumentStatus.DRAFT);

        mockMvc.perform(get("/api/documents/{id}", document.getId()).with(loggedInAs(author)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.createdById").value(author.getId()))
                .andExpect(jsonPath("$.createdByName").value("Adam Author"))
                .andExpect(jsonPath("$.createdAt").isNotEmpty());
    }

    @Test
    void the_documents_list_includes_each_authors_name() throws Exception {
        User adam = testData.user(UserRole.AUTHOR, "Adam Author");
        User bella = testData.user(UserRole.AUTHOR, "Bella Author");
        testData.document(adam, DocumentStatus.DRAFT);
        testData.document(bella, DocumentStatus.IN_REVIEW);

        mockMvc.perform(get("/api/documents").with(loggedInAs(adam)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].createdByName", containsInAnyOrder("Adam Author", "Bella Author")));
    }

    @Test
    void a_new_comment_includes_the_authors_name() throws Exception {
        User commenter = testData.user(UserRole.REVIEWER, "Rita Reviewer");
        Document document = testData.document(testData.user(UserRole.AUTHOR), DocumentStatus.IN_REVIEW);

        mockMvc.perform(post("/api/documents/{id}/comments", document.getId())
                        .with(loggedInAs(commenter))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"content": "Please add a summary."}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.authorName").value("Rita Reviewer"));

        mockMvc.perform(get("/api/documents/{id}/comments", document.getId()).with(loggedInAs(commenter)))
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].authorName").value("Rita Reviewer"))
                .andExpect(jsonPath("$[0].content").value("Please add a summary."));
    }

    @Test
    void a_new_decision_includes_the_deciders_name() throws Exception {
        User reviewer = testData.user(UserRole.REVIEWER, "Rita Reviewer");
        Document document = testData.document(testData.user(UserRole.AUTHOR), DocumentStatus.IN_REVIEW);

        mockMvc.perform(post("/api/documents/{id}/decisions", document.getId())
                        .with(loggedInAs(reviewer))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"decision": "APPROVE"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.decidedByName").value("Rita Reviewer"));
    }

    @Test
    void the_documents_list_is_newest_first() throws Exception {
        User author = testData.user(UserRole.AUTHOR);
        Document older = testData.document(author, DocumentStatus.DRAFT, "Older");
        Document newest = testData.document(author, DocumentStatus.DRAFT, "Newest");
        Document oldest = testData.document(author, DocumentStatus.DRAFT, "Oldest");
        // Give the documents clearly different times, in a different order than their ids,
        // so the test shows the list is sorted by creation time and not by id.
        setCreatedAt(older, LocalDateTime.now().minusDays(1));
        setCreatedAt(newest, LocalDateTime.now());
        setCreatedAt(oldest, LocalDateTime.now().minusDays(2));

        mockMvc.perform(get("/api/documents").with(loggedInAs(author)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(3)))
                .andExpect(jsonPath("$[0].title").value("Newest"))
                .andExpect(jsonPath("$[1].title").value("Older"))
                .andExpect(jsonPath("$[2].title").value("Oldest"));
    }

    @Test
    void a_missing_document_gives_404_with_our_error_shape() throws Exception {
        User author = testData.user(UserRole.AUTHOR);

        mockMvc.perform(get("/api/documents/{id}", 999_999).with(loggedInAs(author)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value("Document not found with id: 999999"));
    }

    @Test
    void commenting_on_a_missing_document_gives_404_with_our_error_shape() throws Exception {
        User author = testData.user(UserRole.AUTHOR);

        mockMvc.perform(post("/api/documents/{id}/comments", 999_999)
                        .with(loggedInAs(author))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"content": "Hello?"}
                                """))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value("Document not found with id: 999999"));
    }

    @Test
    void deciding_on_a_missing_document_gives_404_with_our_error_shape() throws Exception {
        User reviewer = testData.user(UserRole.REVIEWER);

        mockMvc.perform(post("/api/documents/{id}/decisions", 999_999)
                        .with(loggedInAs(reviewer))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"decision": "APPROVE"}
                                """))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value("Document not found with id: 999999"));
    }

    @Test
    void validation_errors_give_400_with_our_error_shape() throws Exception {
        User author = testData.user(UserRole.AUTHOR);

        mockMvc.perform(post("/api/documents")
                        .with(loggedInAs(author))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title": "  ", "content": "Text"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.errors", hasSize(1)))
                .andExpect(jsonPath("$.errors[0].field").value("title"))
                .andExpect(jsonPath("$.errors[0].message").isNotEmpty());
    }

    @Test
    void creating_a_user_with_an_existing_email_gives_409() throws Exception {
        User admin = testData.user(UserRole.ADMIN);

        mockMvc.perform(post("/api/users")
                        .with(loggedInAs(admin))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email": "%s", "fullName": "Copy", "roleName": "AUTHOR", "password": "secret"}
                                """.formatted(admin.getEmail())))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message").value("Email already exists"));
    }

    private void setCreatedAt(Document document, LocalDateTime createdAt) {
        jdbcTemplate.update("update document set created_at = ? where id = ?", createdAt, document.getId());
    }
}
