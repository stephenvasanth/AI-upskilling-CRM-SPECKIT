package com.aicrm.module.admin.dto;

import java.time.Instant;

public record TagAdminDto(
    String  id,
    String  name,
    String  colour,
    long    contactCount,
    Instant createdAt
) {}
