package com.docflow.backand.comment.web;

import jakarta.validation.constraints.NotBlank;

public class CreateDocumentCommentRequest {

    @NotBlank
    private String content;

    public CreateDocumentCommentRequest() {
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }
}
