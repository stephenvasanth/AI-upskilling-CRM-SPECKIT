package com.aicrm.module.dashboard.dto;

import java.math.BigDecimal;

public record MetricsDto(
    long       openDealCount,
    BigDecimal totalPipelineValue,
    long       todayTaskCount,
    long       newContactCount
) {}
