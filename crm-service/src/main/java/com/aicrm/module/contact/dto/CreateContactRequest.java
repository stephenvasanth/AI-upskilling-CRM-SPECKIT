package com.aicrm.module.contact.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CreateContactRequest(
    @NotBlank @Size(max = 100) String firstName,
    @NotBlank @Size(max = 100) String lastName,
    @Email    @Size(max = 255) String email,
                               String phone,
                               String jobTitle,
                               String companyId,
                               String ownerId,
                               List<String> tagIds
) {}
