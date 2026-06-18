package com.aicrm.module.activity.dto;

import com.aicrm.module.activity.ActivityType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public record CreateActivityRequest(
    @NotNull                   ActivityType type,
    @NotBlank @Size(max = 255) String       subject,
                               String       notes,
                               Instant      activityDate,
                               String       contactId,
                               String       dealId
) {}
