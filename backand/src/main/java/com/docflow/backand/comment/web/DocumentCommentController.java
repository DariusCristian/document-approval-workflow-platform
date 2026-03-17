package com.docflow.backand.comment.web;

import java.util.List;

import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import com.docflow.backand.comment.domain.DocumentComment;
import com.docflow.backand.comment.service.DocumentCommentService;

@RestController
public class DocumentCommentController {

    private final DocumentCommentService documentCommentService;

    public DocumentCommentController(DocumentCommentService documentCommentService) {
        this.documentCommentService = documentCommentService;
    }

    @GetMapping("/api/documents/{documentId}/comments")
    public List<DocumentCommentResponse> getComments(@PathVariable Long documentId) {
        return documentCommentService.getCommentsForDocument(documentId).stream()
                .map(this::toDocumentCommentResponse)
                .toList();
    }

    @PostMapping("/api/documents/{documentId}/comments")
    public DocumentCommentResponse createComment(
            @PathVariable Long documentId,
            @Valid @RequestBody CreateDocumentCommentRequest request) {
        DocumentComment documentComment = documentCommentService.createComment(
                documentId,
                request.getAuthorId(),
                request.getContent());
        return toDocumentCommentResponse(documentComment);
    }

    private DocumentCommentResponse toDocumentCommentResponse(DocumentComment documentComment) {
        DocumentCommentResponse response = new DocumentCommentResponse();
        response.setId(documentComment.getId());
        response.setDocumentId(documentComment.getDocument().getId());
        response.setAuthorId(documentComment.getAuthor().getId());
        response.setContent(documentComment.getContent());
        response.setCreatedAt(documentComment.getCreatedAt());
        return response;
    }
}
