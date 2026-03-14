package com.docflow.backand.document.web;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.docflow.backand.document.domain.Document;
import com.docflow.backand.document.service.DocumentService;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {

    private final DocumentService documentService;

    public DocumentController(DocumentService documentService) {
        this.documentService = documentService;
    }

    @GetMapping
    public List<DocumentResponse> getAllDocuments() {
        return documentService.getAllDocuments().stream()
                .map(this::toDocumentResponse)
                .toList();
    }

    @PostMapping
    public DocumentResponse createDocument(@RequestBody CreateDocumentRequest request) {
        Document document = documentService.createDocument(
                request.getTitle(),
                request.getContent(),
                request.getCreatedById());

        return toDocumentResponse(document);
    }

    private DocumentResponse toDocumentResponse(Document document) {
        DocumentResponse response = new DocumentResponse();
        response.setId(document.getId());
        response.setTitle(document.getTitle());
        response.setContent(document.getContent());
        response.setStatus(document.getStatus().name());
        response.setCreatedById(document.getCreatedBy().getId());
        response.setCreatedAt(document.getCreatedAt());
        return response;
    }
}
