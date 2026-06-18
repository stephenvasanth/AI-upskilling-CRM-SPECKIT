package com.aicrm.module.admin.dto;

import com.aicrm.module.user.Role;
import jakarta.validation.constraints.NotNull;

public record UpdateUserRoleRequest(@NotNull Role role) {}
