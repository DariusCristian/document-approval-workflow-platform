package com.docflow.backend.auth;

import static com.docflow.backend.support.TestData.loggedInAs;
import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import jakarta.servlet.http.Cookie;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import com.docflow.backend.document.repository.DocumentRepository;
import com.docflow.backend.support.IntegrationTest;
import com.docflow.backend.user.domain.User;
import com.docflow.backend.user.domain.UserRole;

class CsrfIntegrationTest extends IntegrationTest {

    private static final String NEW_DOCUMENT = """
            {"title": "Travel policy", "content": "Book trains, not planes."}
            """;

    @Autowired
    private DocumentRepository documentRepository;

    @Test
    void a_post_without_csrf_token_is_rejected_with_403() throws Exception {
        User author = testData.user(UserRole.AUTHOR);

        mockMvc.perform(post("/api/documents")
                        .with(loggedInAs(author))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(NEW_DOCUMENT))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.message").value(containsString("CSRF")));

        assertThat(documentRepository.count()).isZero();
    }

    @Test
    void a_post_with_csrf_token_is_accepted() throws Exception {
        User author = testData.user(UserRole.AUTHOR);

        mockMvc.perform(post("/api/documents")
                        .with(loggedInAs(author))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(NEW_DOCUMENT))
                .andExpect(status().isOk());

        assertThat(documentRepository.count()).isEqualTo(1);
    }

    @Test
    void a_post_with_a_wrong_csrf_token_is_rejected_with_403() throws Exception {
        User author = testData.user(UserRole.AUTHOR);

        mockMvc.perform(post("/api/documents")
                        .with(loggedInAs(author))
                        .with(csrf().useInvalidToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(NEW_DOCUMENT))
                .andExpect(status().isForbidden());
    }

    // The tests below use real tokens from the server instead of spring-security-test's csrf(),
    // the same way the frontend does: read the XSRF-TOKEN cookie, send it back in the X-XSRF-TOKEN header.

    @Test
    void login_without_csrf_token_is_rejected_with_403() throws Exception {
        User author = testData.user(UserRole.AUTHOR);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginBody(author)))
                .andExpect(status().isForbidden());
    }

    @Test
    void the_cookie_alone_is_not_enough_without_the_header() throws Exception {
        User author = testData.user(UserRole.AUTHOR);
        Cookie csrfCookie = fetchCsrfCookie();

        // What a forged request from another site looks like: the browser sends our cookie,
        // but the attacker can't read it, so the header is missing.
        mockMvc.perform(post("/api/auth/login")
                        .cookie(csrfCookie)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginBody(author)))
                .andExpect(status().isForbidden());
    }

    @Test
    void a_real_token_from_the_csrf_endpoint_is_accepted_in_the_header() throws Exception {
        User author = testData.user(UserRole.AUTHOR);
        Cookie csrfCookie = fetchCsrfCookie();

        mockMvc.perform(post("/api/auth/login")
                        .cookie(csrfCookie)
                        .header("X-XSRF-TOKEN", csrfCookie.getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginBody(author)))
                .andExpect(status().isOk());
    }

    @Test
    void a_header_that_does_not_match_the_cookie_is_rejected_with_403() throws Exception {
        User author = testData.user(UserRole.AUTHOR);
        Cookie csrfCookie = fetchCsrfCookie();

        mockMvc.perform(post("/api/auth/login")
                        .cookie(csrfCookie)
                        .header("X-XSRF-TOKEN", "made-up-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginBody(author)))
                .andExpect(status().isForbidden());
    }

    private Cookie fetchCsrfCookie() throws Exception {
        Cookie cookie = mockMvc.perform(get("/api/auth/csrf"))
                .andExpect(status().isNoContent())
                .andReturn()
                .getResponse()
                .getCookie("XSRF-TOKEN");
        assertThat(cookie).isNotNull();
        return cookie;
    }

    private static String loginBody(User user) {
        return """
                {"email": "%s", "password": "password123"}
                """.formatted(user.getEmail());
    }
}
