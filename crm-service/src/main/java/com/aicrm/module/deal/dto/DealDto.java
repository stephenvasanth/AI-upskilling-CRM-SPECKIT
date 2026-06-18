package com.aicrm.module.deal.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record DealDto(
    String     id,
    String     title,
    BigDecimal value,
    String     stage,
    LocalDate  expectedCloseDate,
    String     contactId,
    String     contactName,
    String     ownerId,
    String     ownerName,
    String     notes,
    Instant    createdAt,
    Instant    updatedAt
) {}
