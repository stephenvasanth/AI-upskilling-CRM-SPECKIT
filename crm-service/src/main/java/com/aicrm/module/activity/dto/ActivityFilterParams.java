package com.aicrm.module.activity.dto;

import com.aicrm.module.activity.ActivityType;

import java.time.Instant;

public record ActivityFilterParams(
    ActivityType type,
    String       contactId,
    Instant      dateFrom,
    Instant      dateTo,
    int          page
) {}
