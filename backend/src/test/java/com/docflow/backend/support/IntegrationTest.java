package com.docflow.backend.support;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayNameGeneration;
import org.junit.jupiter.api.DisplayNameGenerator;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.web.FilterChainProxy;
import org.springframework.security.web.csrf.CsrfFilter;
import org.springframework.security.web.csrf.CsrfTokenRepository;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.postgresql.PostgreSQLContainer;

import com.docflow.backend.user.domain.User;

/**
 * Base class for tests that run the whole app against a real PostgreSQL database.
 *
 * <ul>
 *   <li>One PostgreSQL container is started for the whole test run and shared by all test classes.
 *       Because every subclass has the same configuration, Spring also reuses one application context.</li>
 *   <li>The container's URL replaces the one in application.yml, so tests never touch docflow_db.</li>
 *   <li>No profile is active, so the "dev" profile and DevDataSeeder do not run.</li>
 *   <li>Every table is emptied before each test, so each test only sees the data it creates itself.</li>
 * </ul>
 */
@SpringBootTest(properties = "spring.jpa.show-sql=false")
@AutoConfigureMockMvc
@Import(TestData.class)
@DisplayNameGeneration(DisplayNameGenerator.ReplaceUnderscores.class)
public abstract class IntegrationTest {

    // Started once in a static block and never stopped by us; Testcontainers removes it when the JVM exits.
    protected static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer("postgres:17-alpine");

    static {
        POSTGRES.start();
    }

    @DynamicPropertySource
    static void databaseProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }

    @Autowired
    protected MockMvc mockMvc;

    @Autowired
    protected TestData testData;

    @Autowired
    protected JdbcTemplate jdbcTemplate;

    @Autowired
    private FilterChainProxy securityFilterChain;

    @Autowired
    private CsrfTokenRepository csrfTokenRepository;

    // TRUNCATE instead of a rolled-back test transaction: requests run exactly like in production
    // (each service call commits its own transaction, lazy loading outside a transaction fails),
    // and data committed by a request is really removed. RESTART IDENTITY resets the ids.
    @BeforeEach
    void cleanDatabase() {
        jdbcTemplate.execute(
                "TRUNCATE TABLE approval_decision, document_comment, document, app_user RESTART IDENTITY CASCADE");
    }

    // spring-security-test's csrf() permanently swaps the CsrfFilter's cookie repository for a session-based
    // test one, in the context that all test classes share. Put the app's real repository back, so every
    // test starts with the same CSRF setup as production (XSRF-TOKEN cookie + X-XSRF-TOKEN header).
    @BeforeEach
    void restoreCsrfTokenRepository() {
        securityFilterChain.getFilterChains().stream()
                .flatMap(chain -> chain.getFilters().stream())
                .filter(CsrfFilter.class::isInstance)
                .forEach(filter -> ReflectionTestUtils.setField(filter, "tokenRepository", csrfTokenRepository));
    }

    // Logs in through the real login endpoint and returns the session, like a browser keeps its cookie.
    protected MockHttpSession logIn(User user) throws Exception {
        return (MockHttpSession) mockMvc.perform(post("/api/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email": "%s", "password": "%s"}
                                """.formatted(user.getEmail(), TestData.PASSWORD)))
                .andExpect(status().isOk())
                .andReturn()
                .getRequest()
                .getSession(false);
    }
}
