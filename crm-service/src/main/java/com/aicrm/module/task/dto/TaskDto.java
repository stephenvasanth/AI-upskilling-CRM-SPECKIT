package com.aicrm.module.task.dto;

import java.time.Instant;
import java.time.LocalDate;

public record TaskDto(
    String    id,
    String    title,
    String    description,
    LocalDate dueDate,
    String    status,
    String    assigneeId,
    String    assigneeName,
    String    contactId,
    String    contactName,
    String    dealId,
    String    dealTitle,
    Instant   createdAt,
    Instant   updatedAt
) {}
