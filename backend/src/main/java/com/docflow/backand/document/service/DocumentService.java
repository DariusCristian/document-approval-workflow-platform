package com.docflow.backand.document.service;

import java.util.List;
import java.util.NoSuchElementException;

import org.springframework.stereotype.Service;

import com.docflow.backand.common.exception.ForbiddenException;
import com.docflow.backand.document.domain.Document;
import com.docflow.backand.document.domain.DocumentStatus;
import com.docflow.backand.document.repository.DocumentRepository;
import com.docflow.backand.user.domain.User;
import com.docflow.backand.user.repository.UserRepository;

@Service
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final UserRepository userRepository;

    public DocumentService(DocumentRepository documentRepository, UserRepository userRepository) {
        this.documentRepository = documentRepository;
        this.userRepository = userRepository;
    }

    public List<Document> getAllDocuments() {
        return documentRepository.findAll();
    }

    public Document getDocumentById(Long id) {
        return documentRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Document not found with id: " + id));
    }

    public Document createDocument(String title, String content, Long createdById) {
        User createdBy = userRepository.findById(createdById)
                .orElseThrow(() -> new IllegalArgumentException("Creator user not found with id: " + createdById));

        Document document = new Document(title, content, DocumentStatus.DRAFT, createdBy);
        return documentRepository.save(document);
    }

    public Document updateStatus(Long documentId, String status, Long currentUserId) {
        Document document = getDocumentById(documentId);

        if (!document.getCreatedBy().getId().equals(currentUserId)) {
            throw new ForbiddenException("Only the author can submit this document for review.");
        }

        DocumentStatus newStatus = parseDocumentStatus(status);
        DocumentStatus currentStatus = document.getStatus();

        if (!isAllowedTransition(currentStatus, newStatus)) {
            throw new IllegalArgumentException(
                    "Invalid status transition: " + currentStatus + " -> " + newStatus
                            + ". Only DRAFT -> IN_REVIEW is allowed here; approve or reject through a decision.");
        }

        document.setStatus(newStatus);
        return documentRepository.save(document);
    }

    private DocumentStatus parseDocumentStatus(String status) {
        if (status == null || status.isBlank()) {
            throw new IllegalArgumentException("Invalid document status: " + status);
        }

        try {
            return DocumentStatus.valueOf(status.trim().toUpperCase());
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException("Invalid document status: " + status);
        }
    }

    // APPROVED and REJECTED are only reached through approval decisions.
    private boolean isAllowedTransition(DocumentStatus currentStatus, DocumentStatus newStatus) {
        return currentStatus == DocumentStatus.DRAFT && newStatus == DocumentStatus.IN_REVIEW;
    }
}
