package com.aicrm.module.dashboard.dto;

import com.aicrm.module.activity.dto.ActivityDto;
import com.aicrm.module.task.dto.TaskDto;

import java.util.List;

public record DashboardSummaryDto(
    MetricsDto           metrics,
    List<StageCountDto>  pipelineSummary,
    List<TaskDto>        myTasks,
    List<ActivityDto>    recentActivities
) {}
