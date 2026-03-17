package com.docflow.backand.comment.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.docflow.backand.comment.domain.DocumentComment;
import com.docflow.backand.comment.repository.DocumentCommentRepository;
import com.docflow.backand.document.domain.Document;
import com.docflow.backand.document.repository.DocumentRepository;
import com.docflow.backand.user.domain.User;
import com.docflow.backand.user.repository.UserRepository;

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
