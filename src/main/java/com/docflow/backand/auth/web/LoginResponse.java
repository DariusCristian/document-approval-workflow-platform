package com.docflow.backand.auth.web;

public class LoginResponse {

    private Long userId;
    private String email;
    private String role;
    private String message;

    public LoginResponse() {
    }

    public LoginResponse(Long userId, String email, String role, String message) {
        this.userId = userId;
        this.email = email;
        this.role = role;
        this.message = message;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
