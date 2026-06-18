package com.aicrm.module.deal.dto;

import java.util.List;
import java.util.Map;

public record DealBoardDto(Map<String, List<DealDto>> stages) {}
