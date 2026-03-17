package com.docflow.backand.document.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.docflow.backand.document.domain.Document;

public interface DocumentRepository extends JpaRepository<Document, Long> {

    List<Document> findAllByCreatedById(Long createdById);
}
