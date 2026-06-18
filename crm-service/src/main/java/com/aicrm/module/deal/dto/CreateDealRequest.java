package com.aicrm.module.deal.dto;

import com.aicrm.module.deal.DealStage;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CreateDealRequest(
    @NotBlank @Size(max = 255) String     title,
    @NotNull                   DealStage  stage,
                               BigDecimal value,
                               LocalDate  expectedCloseDate,
                               String     contactId,
                               String     ownerId,
                               String     notes
) {}
