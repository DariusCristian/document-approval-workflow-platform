package com.docflow.backand.approval.domain;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import com.docflow.backand.document.domain.Document;
import com.docflow.backand.user.domain.User;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "approval_decision")
public class ApprovalDecision {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "document_id", nullable = false)
    private Document document;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "decided_by", nullable = false)
    private User decidedBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private ApprovalDecisionType decision;

    @Column(columnDefinition = "text")
    private String comment;

    @CreationTimestamp
    @Column(name = "decided_at", nullable = false, updatable = false)
    private LocalDateTime decidedAt;

    public ApprovalDecision() {
    }

    public ApprovalDecision(Document document, User decidedBy, ApprovalDecisionType decision, String comment) {
        this.document = document;
        this.decidedBy = decidedBy;
        this.decision = decision;
        this.comment = comment;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Document getDocument() {
        return document;
    }

    public void setDocument(Document document) {
        this.document = document;
    }

    public User getDecidedBy() {
        return decidedBy;
    }

    public void setDecidedBy(User decidedBy) {
        this.decidedBy = decidedBy;
    }

    public ApprovalDecisionType getDecision() {
        return decision;
    }

    public void setDecision(ApprovalDecisionType decision) {
        this.decision = decision;
    }

    public String getComment() {
        return comment;
    }

    public void setComment(String comment) {
        this.comment = comment;
    }

    public LocalDateTime getDecidedAt() {
        return decidedAt;
    }

    public void setDecidedAt(LocalDateTime decidedAt) {
        this.decidedAt = decidedAt;
    }
}
