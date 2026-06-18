package com.aicrm.task;

import com.aicrm.common.dto.PageResponse;
import com.aicrm.common.exception.ApiException;
import com.aicrm.module.contact.ContactRepository;
import com.aicrm.module.deal.DealRepository;
import com.aicrm.module.task.Task;
import com.aicrm.module.task.TaskFilter;
import com.aicrm.module.task.TaskRepository;
import com.aicrm.module.task.TaskService;
import com.aicrm.module.task.TaskStatus;
import com.aicrm.module.task.dto.*;
import com.aicrm.module.user.User;
import com.aicrm.module.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TaskServiceTest {

    @Mock private TaskRepository taskRepository;
    @Mock private UserRepository userRepository;
    @Mock private ContactRepository contactRepository;
    @Mock private DealRepository dealRepository;

    @InjectMocks private TaskService taskService;

    private User sampleUser;
    private Task sampleTask;

    @BeforeEach
    void setUp() {
        sampleUser = new User();
        sampleUser.setId("user-1");
        sampleUser.setDisplayName("Jane Doe");

        sampleTask = new Task();
        sampleTask.setId("task-1");
        sampleTask.setTitle("Follow up");
        sampleTask.setDueDate(LocalDate.of(2026, 12, 31));
        sampleTask.setStatus(TaskStatus.PENDING);
        sampleTask.setAssignee(sampleUser);
    }

    @Test
    void getAll_returnsPagedTasks() {
        Page<Task> page = new PageImpl<>(List.of(sampleTask));
        when(taskRepository.findAllWithFilter(anyString(), anyString(), any(LocalDate.class), any(Pageable.class)))
            .thenReturn(page);

        PageResponse<TaskDto> result = taskService.getAll(TaskFilter.ALL, "user-1", 0);

        assertThat(result.content()).hasSize(1);
        assertThat(result.content().get(0).title()).isEqualTo("Follow up");
    }

    @Test
    void create_withValidRequest_savesAndReturnsDto() {
        when(userRepository.findById("user-1")).thenReturn(Optional.of(sampleUser));
        when(taskRepository.save(any(Task.class))).thenReturn(sampleTask);

        CreateTaskRequest req = new CreateTaskRequest(
            "Follow up", null, LocalDate.of(2026, 12, 31), "user-1", null, null
        );
        TaskDto result = taskService.create(req);

        assertThat(result.title()).isEqualTo("Follow up");
        assertThat(result.status()).isEqualTo("PENDING");
        verify(taskRepository).save(any(Task.class));
    }

    @Test
    void create_assigneeNotFound_throwsApiException() {
        when(userRepository.findById(anyString())).thenReturn(Optional.empty());

        CreateTaskRequest req = new CreateTaskRequest("X", null, LocalDate.now(), "bad-id", null, null);
        assertThatThrownBy(() -> taskService.create(req))
            .isInstanceOf(ApiException.class)
            .hasFieldOrPropertyWithValue("errorCode", com.aicrm.common.exception.ErrorCode.NOT_FOUND);
    }

    @Test
    void toggle_pendingToCompleted_updatesStatus() {
        when(taskRepository.findById("task-1")).thenReturn(Optional.of(sampleTask));
        when(taskRepository.save(any(Task.class))).thenAnswer(inv -> inv.getArgument(0));

        ToggleTaskRequest req = new ToggleTaskRequest(TaskStatus.COMPLETED);
        TaskDto result = taskService.toggle("task-1", req);

        assertThat(sampleTask.getStatus()).isEqualTo(TaskStatus.COMPLETED);
        verify(taskRepository).save(sampleTask);
    }

    @Test
    void toggle_notFound_throwsApiException() {
        when(taskRepository.findById(anyString())).thenReturn(Optional.empty());

        ToggleTaskRequest req = new ToggleTaskRequest(TaskStatus.COMPLETED);
        assertThatThrownBy(() -> taskService.toggle("nonexistent", req))
            .isInstanceOf(ApiException.class)
            .hasFieldOrPropertyWithValue("errorCode", com.aicrm.common.exception.ErrorCode.NOT_FOUND);
    }

    @Test
    void update_existingTask_updatesAndReturns() {
        when(taskRepository.findById("task-1")).thenReturn(Optional.of(sampleTask));
        when(userRepository.findById("user-1")).thenReturn(Optional.of(sampleUser));
        when(taskRepository.save(any(Task.class))).thenReturn(sampleTask);

        UpdateTaskRequest req = new UpdateTaskRequest("Updated", null, LocalDate.now(), "user-1", null, null);
        TaskDto result = taskService.update("task-1", req);

        assertThat(result).isNotNull();
        verify(taskRepository).save(sampleTask);
    }

    @Test
    void delete_existingTask_deletesSuccessfully() {
        when(taskRepository.existsById("task-1")).thenReturn(true);

        taskService.delete("task-1");

        verify(taskRepository).deleteById("task-1");
    }

    @Test
    void delete_notFound_throwsApiException() {
        when(taskRepository.existsById(anyString())).thenReturn(false);

        assertThatThrownBy(() -> taskService.delete("nonexistent"))
            .isInstanceOf(ApiException.class)
            .hasFieldOrPropertyWithValue("errorCode", com.aicrm.common.exception.ErrorCode.NOT_FOUND);
    }
}
