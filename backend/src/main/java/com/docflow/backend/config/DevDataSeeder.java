package com.docflow.backend.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.docflow.backend.approval.domain.ApprovalDecision;
import com.docflow.backend.approval.domain.ApprovalDecisionType;
import com.docflow.backend.approval.repository.ApprovalDecisionRepository;
import com.docflow.backend.comment.domain.DocumentComment;
import com.docflow.backend.comment.repository.DocumentCommentRepository;
import com.docflow.backend.document.domain.Document;
import com.docflow.backend.document.domain.DocumentStatus;
import com.docflow.backend.document.repository.DocumentRepository;
import com.docflow.backend.user.domain.User;
import com.docflow.backend.user.domain.UserRole;
import com.docflow.backend.user.repository.UserRepository;

/**
 * Fills an empty local database with demo accounts and sample documents.
 * Runs only with the "dev" profile, and does nothing if any user already exists.
 */
@Component
@Profile("dev")
public class DevDataSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DevDataSeeder.class);

    private static final String DEMO_PASSWORD = "password123";

    private final UserRepository userRepository;
    private final DocumentRepository documentRepository;
    private final DocumentCommentRepository documentCommentRepository;
    private final ApprovalDecisionRepository approvalDecisionRepository;
    private final PasswordEncoder passwordEncoder;

    public DevDataSeeder(
            UserRepository userRepository,
            DocumentRepository documentRepository,
            DocumentCommentRepository documentCommentRepository,
            ApprovalDecisionRepository approvalDecisionRepository,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.documentRepository = documentRepository;
        this.documentCommentRepository = documentCommentRepository;
        this.approvalDecisionRepository = approvalDecisionRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (userRepository.count() > 0) {
            log.info("Dev seed skipped: database already contains users.");
            return;
        }

        User admin = createUser("admin@docflow.local", "Alice Admin", UserRole.ADMIN);
        User reviewer = createUser("reviewer@docflow.local", "Rita Reviewer", UserRole.REVIEWER);
        User author1 = createUser("author1@docflow.local", "Adam Author", UserRole.AUTHOR);
        User author2 = createUser("author2@docflow.local", "Bella Author", UserRole.AUTHOR);

        // DRAFT: not yet submitted.
        createDocument("Remote Work Policy 2027",
                "Proposed rules for hybrid work: core hours, equipment budget and home-office safety checks.",
                DocumentStatus.DRAFT, author1);

        // IN_REVIEW: waiting for a reviewer, with some discussion.
        Document budget = createDocument("Q4 Marketing Budget",
                "Requested budget of 120,000 EUR for Q4 campaigns, split across online ads, events and print.",
                DocumentStatus.IN_REVIEW, author2);
        createComment(budget, reviewer, "Can you break down the online ads spend by channel?");
        createComment(budget, author2, "Added the breakdown in section 3.");

        // IN_REVIEW, written by the reviewer: someone else (e.g. the admin) has to decide on it.
        Document runbook = createDocument("Incident Response Runbook",
                "Step-by-step guide for handling production incidents: severity levels, on-call contacts and postmortems.",
                DocumentStatus.IN_REVIEW, reviewer);
        createComment(runbook, admin, "Please add the escalation contacts for weekends.");

        // APPROVED: decided by the reviewer.
        Document checklist = createDocument("Vendor Onboarding Checklist",
                "Checklist for onboarding new vendors: contract, data protection agreement, invoicing details.",
                DocumentStatus.APPROVED, author1);
        createComment(checklist, reviewer, "Looks complete. Nice work.");
        createDecision(checklist, reviewer, ApprovalDecisionType.APPROVE, "Clear and complete.");

        // REJECTED: decided by the admin.
        Document relocation = createDocument("Office Relocation Proposal",
                "Proposal to move the Berlin office to a larger building in 2027.",
                DocumentStatus.REJECTED, author2);
        createComment(relocation, author2, "Cost estimate is attached as an appendix.");
        createDecision(relocation, admin, ApprovalDecisionType.REJECT,
                "Costs are not justified yet. Please compare at least two alternatives.");

        log.info("Dev seed complete: 4 demo users (password '{}') and 5 sample documents.", DEMO_PASSWORD);
    }

    private User createUser(String email, String fullName, UserRole role) {
        String passwordHash = passwordEncoder.encode(DEMO_PASSWORD);
        return userRepository.save(new User(email, fullName, role, passwordHash));
    }

    private Document createDocument(String title, String content, DocumentStatus status, User createdBy) {
        return documentRepository.save(new Document(title, content, status, createdBy));
    }

    private void createComment(Document document, User author, String content) {
        documentCommentRepository.save(new DocumentComment(document, author, content));
    }

    private void createDecision(Document document, User decidedBy, ApprovalDecisionType decision, String comment) {
        approvalDecisionRepository.save(new ApprovalDecision(document, decidedBy, decision, comment));
    }
}
