package com.aicrm.module.deal.dto;

import com.aicrm.module.deal.DealStage;
import jakarta.validation.constraints.NotNull;

public record MoveStageRequest(@NotNull DealStage stage) {}
