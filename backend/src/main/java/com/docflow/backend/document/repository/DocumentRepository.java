package com.docflow.backend.document.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.docflow.backend.document.domain.Document;

public interface DocumentRepository extends JpaRepository<Document, Long> {

    List<Document> findAllByCreatedById(Long createdById);
}
