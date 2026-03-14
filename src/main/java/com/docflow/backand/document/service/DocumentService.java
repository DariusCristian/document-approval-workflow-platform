package com.docflow.backand.document.service;

import java.util.List;

import org.springframework.stereotype.Service;

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

    public Document createDocument(String title, String content, Long createdById) {
        User createdBy = userRepository.findById(createdById)
                .orElseThrow(() -> new IllegalArgumentException("Creator user not found with id: " + createdById));

        Document document = new Document(title, content, DocumentStatus.DRAFT, createdBy);
        return documentRepository.save(document);
    }
}
