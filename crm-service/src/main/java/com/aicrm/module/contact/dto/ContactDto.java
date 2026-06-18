package com.aicrm.module.contact.dto;

import com.aicrm.module.tag.dto.TagDto;

import java.time.Instant;
import java.util.List;

public record ContactDto(
    String id,
    String firstName,
    String lastName,
    String email,
    String phone,
    String jobTitle,
    String companyId,
    String companyName,
    String ownerId,
    String ownerName,
    List<TagDto> tags,
    Instant createdAt,
    Instant updatedAt
) {}
