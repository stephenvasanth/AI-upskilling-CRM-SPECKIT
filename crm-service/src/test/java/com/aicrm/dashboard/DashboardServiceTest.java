package com.aicrm.dashboard;

import com.aicrm.module.activity.Activity;
import com.aicrm.module.activity.ActivityRepository;
import com.aicrm.module.activity.ActivityType;
import com.aicrm.module.activity.dto.ActivityDto;
import com.aicrm.module.contact.ContactRepository;
import com.aicrm.module.dashboard.DashboardService;
import com.aicrm.module.dashboard.dto.DashboardSummaryDto;
import com.aicrm.module.deal.DealRepository;
import com.aicrm.module.task.Task;
import com.aicrm.module.task.TaskRepository;
import com.aicrm.module.task.TaskStatus;
import com.aicrm.module.task.dto.TaskDto;
import com.aicrm.module.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

    @Mock private DealRepository dealRepository;
    @Mock private TaskRepository taskRepository;
    @Mock private ActivityRepository activityRepository;
    @Mock private ContactRepository contactRepository;

    @InjectMocks private DashboardService dashboardService;

    private User sampleUser;
    private Task sampleTask;
    private Activity sampleActivity;

    @BeforeEach
    void setUp() {
        sampleUser = new User();
        sampleUser.setId("user-1");
        sampleUser.setDisplayName("Alice");

        sampleTask = new Task();
        sampleTask.setId("task-1");
        sampleTask.setTitle("Follow up");
        sampleTask.setDueDate(LocalDate.now().plusDays(1));
        sampleTask.setStatus(TaskStatus.PENDING);
        sampleTask.setAssignee(sampleUser);

        sampleActivity = new Activity();
        sampleActivity.setId("act-1");
        sampleActivity.setType(ActivityType.CALL);
        sampleActivity.setSubject("Intro call");
        sampleActivity.setActivityDate(Instant.now());
        sampleActivity.setAuthor(sampleUser);
        sampleActivity.setCreatedAt(Instant.now());
    }

    @Test
    void getSummary_returnsMetrics() {
        when(dealRepository.countOpenDeals()).thenReturn(5L);
        when(dealRepository.sumOpenDealValue()).thenReturn(new BigDecimal("50000"));
        when(taskRepository.countByAssignee_IdAndDueDateAndStatus(anyString(), any(LocalDate.class), any(TaskStatus.class)))
            .thenReturn(2L);
        when(contactRepository.countByCreatedAtAfter(any(Instant.class))).thenReturn(3L);
        when(dealRepository.getPipelineSummary()).thenReturn(List.of());
        when(taskRepository.findDashboardTasksForUser(anyString(), any(TaskStatus.class), any(PageRequest.class)))
            .thenReturn(List.of(sampleTask));
        when(activityRepository.findRecentActivitiesForDashboard(any(PageRequest.class)))
            .thenReturn(List.of(sampleActivity));

        DashboardSummaryDto result = dashboardService.getSummary("user-1");

        assertThat(result.metrics().openDealCount()).isEqualTo(5L);
        assertThat(result.metrics().totalPipelineValue()).isEqualByComparingTo("50000");
        assertThat(result.metrics().todayTaskCount()).isEqualTo(2L);
        assertThat(result.metrics().newContactCount()).isEqualTo(3L);
    }

    @Test
    void getSummary_myTasksScopedToCurrentUser() {
        when(dealRepository.countOpenDeals()).thenReturn(0L);
        when(dealRepository.sumOpenDealValue()).thenReturn(null);
        when(taskRepository.countByAssignee_IdAndDueDateAndStatus(anyString(), any(), any())).thenReturn(0L);
        when(contactRepository.countByCreatedAtAfter(any())).thenReturn(0L);
        when(dealRepository.getPipelineSummary()).thenReturn(List.of());
        when(taskRepository.findDashboardTasksForUser(eq("user-1"), eq(TaskStatus.PENDING), any(PageRequest.class)))
            .thenReturn(List.of(sampleTask));
        when(activityRepository.findRecentActivitiesForDashboard(any())).thenReturn(List.of());

        DashboardSummaryDto result = dashboardService.getSummary("user-1");

        assertThat(result.myTasks()).hasSize(1);
        assertThat(result.myTasks().get(0).title()).isEqualTo("Follow up");
    }

    @Test
    void getSummary_recentActivitiesLimitedTo10() {
        when(dealRepository.countOpenDeals()).thenReturn(0L);
        when(dealRepository.sumOpenDealValue()).thenReturn(BigDecimal.ZERO);
        when(taskRepository.countByAssignee_IdAndDueDateAndStatus(anyString(), any(), any())).thenReturn(0L);
        when(contactRepository.countByCreatedAtAfter(any())).thenReturn(0L);
        when(dealRepository.getPipelineSummary()).thenReturn(List.of());
        when(taskRepository.findDashboardTasksForUser(anyString(), any(), any())).thenReturn(List.of());
        when(activityRepository.findRecentActivitiesForDashboard(eq(PageRequest.of(0, 10))))
            .thenReturn(List.of(sampleActivity));

        DashboardSummaryDto result = dashboardService.getSummary("user-1");

        assertThat(result.recentActivities()).hasSize(1);
        assertThat(result.recentActivities().get(0).subject()).isEqualTo("Intro call");
    }

    @Test
    void getSummary_nullPipelineValueDefaultsToZero() {
        when(dealRepository.countOpenDeals()).thenReturn(0L);
        when(dealRepository.sumOpenDealValue()).thenReturn(null);
        when(taskRepository.countByAssignee_IdAndDueDateAndStatus(anyString(), any(), any())).thenReturn(0L);
        when(contactRepository.countByCreatedAtAfter(any())).thenReturn(0L);
        when(dealRepository.getPipelineSummary()).thenReturn(List.of());
        when(taskRepository.findDashboardTasksForUser(anyString(), any(), any())).thenReturn(List.of());
        when(activityRepository.findRecentActivitiesForDashboard(any())).thenReturn(List.of());

        DashboardSummaryDto result = dashboardService.getSummary("user-1");

        assertThat(result.metrics().totalPipelineValue()).isEqualByComparingTo(BigDecimal.ZERO);
    }
}
