package com.aicrm.module.activity.dto;

import java.time.Instant;

public record ActivityDto(
    String  id,
    String  type,
    String  subject,
    String  notes,
    Instant activityDate,
    String  authorId,
    String  authorName,
    String  contactId,
    String  contactName,
    String  dealId,
    String  dealTitle,
    Instant createdAt
) {}
