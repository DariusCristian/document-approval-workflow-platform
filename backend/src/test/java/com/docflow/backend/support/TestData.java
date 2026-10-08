package com.docflow.backend.support;

import java.util.concurrent.atomic.AtomicInteger;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import com.docflow.backend.document.domain.Document;
import com.docflow.backend.document.domain.DocumentStatus;
import com.docflow.backend.document.repository.DocumentRepository;
import com.docflow.backend.security.UserPrincipal;
import com.docflow.backend.user.domain.User;
import com.docflow.backend.user.domain.UserRole;
import com.docflow.backend.user.repository.UserRepository;

/**
 * Creates the users and documents a test needs, directly in the database.
 */
public class TestData {

    public static final String PASSWORD = "password123";

    private static final AtomicInteger counter = new AtomicInteger();

    private final UserRepository userRepository;
    private final DocumentRepository documentRepository;
    private final PasswordEncoder passwordEncoder;

    public TestData(UserRepository userRepository, DocumentRepository documentRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.documentRepository = documentRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public User user(UserRole role) {
        int number = counter.incrementAndGet();
        return user(role, "Test " + role.name().toLowerCase() + " " + number);
    }

    // The email is unique per call; everyone gets the password PASSWORD.
    public User user(UserRole role, String fullName) {
        String email = role.name().toLowerCase() + counter.incrementAndGet() + "@test.local";
        return userRepository.save(new User(email, fullName, role, passwordEncoder.encode(PASSWORD)));
    }

    public Document document(User author, DocumentStatus status) {
        return document(author, status, "Document " + counter.incrementAndGet());
    }

    public Document document(User author, DocumentStatus status, String title) {
        return documentRepository.save(new Document(title, "Some content.", status, author));
    }

    // Makes a MockMvc request run as this user, without going through the login endpoint.
    public static RequestPostProcessor loggedInAs(User user) {
        return SecurityMockMvcRequestPostProcessors.user(new UserPrincipal(user));
    }
}
