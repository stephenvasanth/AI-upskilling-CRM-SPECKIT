package com.aicrm.module.admin.dto;

import java.time.Instant;

public record UserAdminDto(
    String  id,
    String  email,
    String  displayName,
    String  role,
    String  status,
    Instant createdAt
) {}
