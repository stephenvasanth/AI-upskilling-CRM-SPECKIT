package com.aicrm.module.task;

import com.aicrm.common.dto.PageResponse;
import com.aicrm.common.exception.ApiException;
import com.aicrm.module.contact.Contact;
import com.aicrm.module.contact.ContactRepository;
import com.aicrm.module.deal.Deal;
import com.aicrm.module.deal.DealRepository;
import com.aicrm.module.task.dto.*;
import com.aicrm.module.user.User;
import com.aicrm.module.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final ContactRepository contactRepository;
    private final DealRepository dealRepository;

    private static final int PAGE_SIZE = 20;

    @Cacheable(value = "tasks", key = "#filter + ':' + #userId + ':' + #page")
    public PageResponse<TaskDto> getAll(TaskFilter filter, String userId, int page) {
        return PageResponse.of(
            taskRepository.findAllWithFilter(
                filter.name(), userId, LocalDate.now(),
                PageRequest.of(page, PAGE_SIZE)
            ).map(this::toDto)
        );
    }

    @Cacheable(value = "tasks-contact", key = "#contactId")
    public List<TaskDto> getByContact(String contactId) {
        return taskRepository.findByContactIdOrderByDueDateAsc(contactId)
            .stream().map(this::toDto).toList();
    }

    public TaskDto getById(String id) {
        return taskRepository.findById(id)
            .map(this::toDto)
            .orElseThrow(() -> ApiException.notFound("Task"));
    }

    @Caching(evict = {
        @CacheEvict(value = "tasks",     allEntries = true),
        @CacheEvict(value = "dashboard", allEntries = true)
    })
    @Transactional
    public TaskDto create(CreateTaskRequest request) {
        Task task = new Task();
        applyRequest(task, request.title(), request.description(), request.dueDate(),
            request.assigneeId(), request.contactId(), request.dealId());
        return toDto(taskRepository.save(task));
    }

    @Caching(evict = {
        @CacheEvict(value = "tasks",     allEntries = true),
        @CacheEvict(value = "dashboard", allEntries = true)
    })
    @Transactional
    public TaskDto update(String id, UpdateTaskRequest request) {
        Task task = taskRepository.findById(id)
            .orElseThrow(() -> ApiException.notFound("Task"));
        applyRequest(task, request.title(), request.description(), request.dueDate(),
            request.assigneeId(), request.contactId(), request.dealId());
        return toDto(taskRepository.save(task));
    }

    @Caching(evict = {
        @CacheEvict(value = "tasks",     allEntries = true),
        @CacheEvict(value = "dashboard", allEntries = true)
    })
    @Transactional
    public TaskDto toggle(String id, ToggleTaskRequest request) {
        Task task = taskRepository.findById(id)
            .orElseThrow(() -> ApiException.notFound("Task"));
        task.setStatus(request.status());
        return toDto(taskRepository.save(task));
    }

    @Caching(evict = {
        @CacheEvict(value = "tasks",     allEntries = true),
        @CacheEvict(value = "dashboard", allEntries = true)
    })
    @Transactional
    public void delete(String id) {
        if (!taskRepository.existsById(id)) {
            throw ApiException.notFound("Task");
        }
        taskRepository.deleteById(id);
    }

    private void applyRequest(Task task, String title, String description, LocalDate dueDate,
                               String assigneeId, String contactId, String dealId) {
        task.setTitle(title);
        task.setDescription(description);
        task.setDueDate(dueDate);

        User assignee = userRepository.findById(assigneeId)
            .orElseThrow(() -> ApiException.notFound("User"));
        task.setAssignee(assignee);

        if (contactId != null && !contactId.isBlank()) {
            Contact contact = contactRepository.findById(contactId)
                .orElseThrow(() -> ApiException.notFound("Contact"));
            task.setContact(contact);
        } else {
            task.setContact(null);
        }

        if (dealId != null && !dealId.isBlank()) {
            Deal deal = dealRepository.findById(dealId)
                .orElseThrow(() -> ApiException.notFound("Deal"));
            task.setDeal(deal);
        } else {
            task.setDeal(null);
        }
    }

    private TaskDto toDto(Task t) {
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
}
