package com.docflow.backand.common.exception;

/**
 * The user is logged in but not allowed to do this action. Mapped to HTTP 403.
 */
public class ForbiddenException extends RuntimeException {

    public ForbiddenException(String message) {
        super(message);
    }
}
