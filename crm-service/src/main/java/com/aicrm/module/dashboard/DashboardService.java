package com.aicrm.module.dashboard;

import com.aicrm.module.activity.Activity;
import com.aicrm.module.activity.ActivityRepository;
import com.aicrm.module.activity.dto.ActivityDto;
import com.aicrm.module.contact.ContactRepository;
import com.aicrm.module.dashboard.dto.DashboardSummaryDto;
import com.aicrm.module.dashboard.dto.MetricsDto;
import com.aicrm.module.dashboard.dto.StageCountDto;
import com.aicrm.module.deal.DealRepository;
import com.aicrm.module.task.Task;
import com.aicrm.module.task.TaskRepository;
import com.aicrm.module.task.TaskStatus;
import com.aicrm.module.task.dto.TaskDto;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final DealRepository dealRepository;
    private final TaskRepository taskRepository;
    private final ActivityRepository activityRepository;
    private final ContactRepository contactRepository;

    @Cacheable(value = "dashboard", key = "'summary:' + #userId")
    public DashboardSummaryDto getSummary(String userId) {
        BigDecimal pipelineValue = dealRepository.sumOpenDealValue();
        if (pipelineValue == null) pipelineValue = BigDecimal.ZERO;

        MetricsDto metrics = new MetricsDto(
            dealRepository.countOpenDeals(),
            pipelineValue,
            taskRepository.countByAssignee_IdAndDueDateAndStatus(userId, LocalDate.now(), TaskStatus.PENDING),
            contactRepository.countByCreatedAtAfter(Instant.now().minus(7, ChronoUnit.DAYS))
        );

        List<StageCountDto> pipelineSummary = dealRepository.getPipelineSummary().stream()
            .map(row -> new StageCountDto(
                row[0].toString(),
                ((Number) row[1]).longValue(),
                row[2] != null ? (BigDecimal) row[2] : BigDecimal.ZERO
            ))
            .toList();

        List<TaskDto> myTasks = taskRepository
            .findDashboardTasksForUser(userId, TaskStatus.PENDING, PageRequest.of(0, 5))
            .stream()
            .map(this::toTaskDto)
            .toList();

        List<ActivityDto> recentActivities = activityRepository
            .findRecentActivitiesForDashboard(PageRequest.of(0, 10))
            .stream()
            .map(this::toActivityDto)
            .toList();

        return new DashboardSummaryDto(metrics, pipelineSummary, myTasks, recentActivities);
    }

    private TaskDto toTaskDto(Task t) {
        return new TaskDto(
            t.getId(),
            t.getTitle(),
            t.getDescription(),
            t.getDueDate(),
            t.getStatus().name(),
            t.getAssignee() != null ? t.getAssignee().getId() : null,
            t.getAssignee() != null ? t.getAssignee().getDisplayName() : null,
            t.getContact() != null ? t.getContact().getId() : null,
            t.getContact() != null ? t.getContact().getFirstName() + " " + t.getContact().getLastName() : null,
            t.getDeal() != null ? t.getDeal().getId() : null,
            t.getDeal() != null ? t.getDeal().getTitle() : null,
            t.getCreatedAt(),
            t.getUpdatedAt()
        );
    }

    private ActivityDto toActivityDto(Activity a) {
        return new ActivityDto(
            a.getId(),
            a.getType().name(),
            a.getSubject(),
            a.getNotes(),
            a.getActivityDate(),
            a.getAuthor() != null ? a.getAuthor().getId() : null,
            a.getAuthor() != null ? a.getAuthor().getDisplayName() : null,
            a.getContact() != null ? a.getContact().getId() : null,
            a.getContact() != null ? a.getContact().getFirstName() + " " + a.getContact().getLastName() : null,
            a.getDeal() != null ? a.getDeal().getId() : null,
            a.getDeal() != null ? a.getDeal().getTitle() : null,
            a.getCreatedAt()
        );
    }
}
