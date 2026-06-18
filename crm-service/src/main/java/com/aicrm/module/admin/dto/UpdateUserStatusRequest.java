package com.aicrm.module.admin.dto;

import com.aicrm.module.user.Status;
import jakarta.validation.constraints.NotNull;

public record UpdateUserStatusRequest(@NotNull Status status) {}
