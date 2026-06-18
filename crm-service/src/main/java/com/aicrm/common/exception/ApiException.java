package com.aicrm.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class ApiException extends RuntimeException {

    private final ErrorCode errorCode;
    private final HttpStatus httpStatus;

    public ApiException(ErrorCode errorCode, String message, HttpStatus httpStatus) {
        super(message);
        this.errorCode = errorCode;
        this.httpStatus = httpStatus;
    }

    public static ApiException authFailed() {
        return new ApiException(ErrorCode.AUTH_FAILED, "Invalid email or password", HttpStatus.UNAUTHORIZED);
    }

    public static ApiException unauthorized() {
        return new ApiException(ErrorCode.UNAUTHORIZED, "Authentication required", HttpStatus.UNAUTHORIZED);
    }

    public static ApiException forbidden() {
        return new ApiException(ErrorCode.FORBIDDEN, "Access denied", HttpStatus.FORBIDDEN);
    }

    public static ApiException notFound(String resource) {
        return new ApiException(ErrorCode.NOT_FOUND, resource + " not found", HttpStatus.NOT_FOUND);
    }

    public static ApiException conflict(String message) {
        return new ApiException(ErrorCode.CONFLICT, message, HttpStatus.CONFLICT);
    }

    public static ApiException invalidPassword() {
        return new ApiException(ErrorCode.INVALID_PASSWORD, "Current password is incorrect", HttpStatus.BAD_REQUEST);
    }

    public static ApiException lastAdmin() {
        return new ApiException(ErrorCode.LAST_ADMIN, "Cannot deactivate or demote the last active admin", HttpStatus.CONFLICT);
    }

    public static ApiException selfDeactivation() {
        return new ApiException(ErrorCode.SELF_DEACTIVATION, "Cannot deactivate your own account", HttpStatus.BAD_REQUEST);
    }
}
