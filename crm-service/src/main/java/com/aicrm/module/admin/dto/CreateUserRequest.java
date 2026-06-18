package com.aicrm.module.admin.dto;

import com.aicrm.module.user.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateUserRequest(
    @NotBlank @Email @Size(max = 255) String email,
    @NotBlank @Size(max = 100)        String displayName,
    @NotBlank @Size(min = 8)          String initialPassword,
    @NotNull                          Role   role
) {}
