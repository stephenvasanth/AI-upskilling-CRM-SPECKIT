package com.aicrm.module.task.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record UpdateTaskRequest(
    @NotBlank @Size(max = 255) String    title,
                               String    description,
    @NotNull                   LocalDate dueDate,
    @NotBlank                  String    assigneeId,
                               String    contactId,
                               String    dealId
) {}
