package com.docflow.backend.comment.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.docflow.backend.comment.domain.DocumentComment;
import com.docflow.backend.comment.repository.DocumentCommentRepository;
import com.docflow.backend.document.domain.Document;
import com.docflow.backend.document.repository.DocumentRepository;
import com.docflow.backend.user.domain.User;
import com.docflow.backend.user.repository.UserRepository;

@Service
public class DocumentCommentService {

    private final DocumentCommentRepository documentCommentRepository;
    private final DocumentRepository documentRepository;
    private final UserRepository userRepository;

    public DocumentCommentService(
            DocumentCommentRepository documentCommentRepository,
            DocumentRepository documentRepository,
            UserRepository userRepository) {
        this.documentCommentRepository = documentCommentRepository;
        this.documentRepository = documentRepository;
        this.userRepository = userRepository;
    }

    public List<DocumentComment> getCommentsForDocument(Long documentId) {
        return documentCommentRepository.findAllByDocumentIdOrderByCreatedAtAsc(documentId);
    }

    public DocumentComment createComment(Long documentId, Long authorId, String content) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new IllegalArgumentException("Document not found with id: " + documentId));

        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + authorId));

        DocumentComment documentComment = new DocumentComment(document, author, content);
        return documentCommentRepository.save(documentComment);
    }
}
