package com.docflow.backend.document.web;

import jakarta.validation.constraints.NotBlank;

public class UpdateDocumentStatusRequest {

    @NotBlank
    private String status;

    public UpdateDocumentStatusRequest() {
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
