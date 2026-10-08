package com.docflow.backend.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import com.docflow.backend.support.IntegrationTest;
import com.docflow.backend.user.domain.User;
import com.docflow.backend.user.domain.UserRole;

class AuthenticationIntegrationTest extends IntegrationTest {

    @Test
    void requests_without_login_are_rejected_with_401() throws Exception {
        mockMvc.perform(get("/api/documents"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.message").value("Authentication required"));
    }

    @Test
    void login_with_the_correct_password_returns_the_user() throws Exception {
        User author = testData.user(UserRole.AUTHOR);

        mockMvc.perform(loginRequest(author.getEmail(), "password123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId").value(author.getId()))
                .andExpect(jsonPath("$.email").value(author.getEmail()))
                .andExpect(jsonPath("$.role").value("AUTHOR"));
    }

    @Test
    void login_with_a_wrong_password_is_rejected_with_401() throws Exception {
        User author = testData.user(UserRole.AUTHOR);

        mockMvc.perform(loginRequest(author.getEmail(), "wrong-password"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.message").value("Invalid email or password."));
    }

    @Test
    void login_with_an_unknown_email_gives_the_same_401_as_a_wrong_password() throws Exception {
        mockMvc.perform(loginRequest("nobody@test.local", "password123"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid email or password."));
    }

    @Test
    void login_with_empty_fields_is_rejected_with_400() throws Exception {
        mockMvc.perform(loginRequest("", ""))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.errors", hasSize(2)));
    }

    @Test
    void me_returns_the_logged_in_user() throws Exception {
        User reviewer = testData.user(UserRole.REVIEWER, "Rita Reviewer");
        MockHttpSession session = logIn(reviewer);

        mockMvc.perform(get("/api/auth/me").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(reviewer.getId()))
                .andExpect(jsonPath("$.email").value(reviewer.getEmail()))
                .andExpect(jsonPath("$.fullName").value("Rita Reviewer"))
                .andExpect(jsonPath("$.role").value("REVIEWER"));
    }

    @Test
    void me_without_login_is_rejected_with_401() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void logout_ends_the_session() throws Exception {
        User author = testData.user(UserRole.AUTHOR);
        MockHttpSession session = logIn(author);
        mockMvc.perform(get("/api/auth/me").session(session))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/auth/logout").session(session).with(csrf()))
                .andExpect(status().isNoContent());

        assertThat(session.isInvalid()).isTrue();
        // The browser still sends its old cookie, but the server no longer knows that session.
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    private static MockHttpServletRequestBuilder loginRequest(String email, String password) {
        return post("/api/auth/login")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"email": "%s", "password": "%s"}
                        """.formatted(email, password));
    }
}
