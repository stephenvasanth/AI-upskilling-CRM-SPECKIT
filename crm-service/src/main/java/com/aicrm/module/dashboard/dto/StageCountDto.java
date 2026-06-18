package com.aicrm.module.dashboard.dto;

import java.math.BigDecimal;

public record StageCountDto(
    String     stage,
    long       count,
    BigDecimal totalValue
) {}
