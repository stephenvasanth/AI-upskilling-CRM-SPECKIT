package com.aicrm.module.task.dto;

import com.aicrm.module.task.TaskStatus;
import jakarta.validation.constraints.NotNull;

public record ToggleTaskRequest(@NotNull TaskStatus status) {}
