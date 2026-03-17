package com.docflow.backand.comment.web;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class CreateDocumentCommentRequest {

    @NotNull
    private Long authorId;

    @NotBlank
    private String content;

    public CreateDocumentCommentRequest() {
    }

    public Long getAuthorId() {
        return authorId;
    }

    public void setAuthorId(Long authorId) {
        this.authorId = authorId;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }
}
