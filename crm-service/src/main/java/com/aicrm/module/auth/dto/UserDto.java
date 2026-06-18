package com.aicrm.module.auth.dto;

import java.time.Instant;

public record UserDto(
        String id,
        String email,
        String displayName,
        String role,
        String status,
        Instant createdAt
) {}
