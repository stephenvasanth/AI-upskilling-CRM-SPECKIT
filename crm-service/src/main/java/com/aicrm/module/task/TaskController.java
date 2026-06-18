package com.aicrm.module.task;

import com.aicrm.common.dto.PageResponse;
import com.aicrm.module.task.dto.*;
import com.aicrm.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @GetMapping
    public PageResponse<TaskDto> getAll(
            @RequestParam(defaultValue = "ALL") String filter,
            @RequestParam(defaultValue = "0") int page,
            @AuthenticationPrincipal UserPrincipal principal) {

        TaskFilter taskFilter;
        try {
            taskFilter = TaskFilter.valueOf(filter.toUpperCase());
        } catch (IllegalArgumentException e) {
            taskFilter = TaskFilter.ALL;
        }
        return taskService.getAll(taskFilter, principal.getUserId(), page);
    }

    @GetMapping("/by-contact/{contactId}")
    public List<TaskDto> getByContact(@PathVariable String contactId) {
        return taskService.getByContact(contactId);
    }

    @GetMapping("/{id}")
    public TaskDto getById(@PathVariable String id) {
        return taskService.getById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TaskDto create(@Valid @RequestBody CreateTaskRequest request) {
        return taskService.create(request);
    }

    @PutMapping("/{id}")
    public TaskDto update(@PathVariable String id, @Valid @RequestBody UpdateTaskRequest request) {
        return taskService.update(id, request);
    }

    @PatchMapping("/{id}/status")
    public TaskDto toggle(@PathVariable String id, @Valid @RequestBody ToggleTaskRequest request) {
        return taskService.toggle(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id) {
        taskService.delete(id);
    }
}
