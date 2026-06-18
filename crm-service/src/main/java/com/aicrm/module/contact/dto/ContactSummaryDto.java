package com.aicrm.module.contact.dto;

import com.aicrm.module.tag.dto.TagDto;

import java.time.Instant;
import java.util.List;

public record ContactSummaryDto(
    String id,
    String firstName,
    String lastName,
    String email,
    String company,
    List<TagDto> tags,
    Instant createdAt
) {}
