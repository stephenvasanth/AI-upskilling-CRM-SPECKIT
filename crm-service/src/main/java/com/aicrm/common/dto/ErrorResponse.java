package com.aicrm.common.dto;

import com.aicrm.common.exception.ErrorCode;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.Map;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ErrorResponse(ErrorDetail error) {

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record ErrorDetail(
            ErrorCode code,
            String message,
            Map<String, String> fields
    ) {}

    public static ErrorResponse of(ErrorCode code, String message) {
        return new ErrorResponse(new ErrorDetail(code, message, null));
    }

    public static ErrorResponse of(ErrorCode code, String message, Map<String, String> fields) {
        return new ErrorResponse(new ErrorDetail(code, message, fields));
    }
}
