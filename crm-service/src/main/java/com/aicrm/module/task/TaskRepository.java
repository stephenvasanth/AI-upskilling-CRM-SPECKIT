package com.aicrm.module.task;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface TaskRepository extends JpaRepository<Task, String> {

    @Query("""
        SELECT t FROM Task t
        LEFT JOIN FETCH t.assignee
        LEFT JOIN FETCH t.contact
        LEFT JOIN FETCH t.deal
        WHERE
          (:filter = 'ALL') OR
          (:filter = 'MY_TASKS'  AND t.assignee.id = :userId AND t.status = 'PENDING') OR
          (:filter = 'OVERDUE'   AND t.dueDate < :today AND t.status = 'PENDING') OR
          (:filter = 'TODAY'     AND t.dueDate = :today AND t.status = 'PENDING') OR
          (:filter = 'UPCOMING'  AND t.dueDate > :today AND t.status = 'PENDING') OR
          (:filter = 'COMPLETED' AND t.status = 'COMPLETED')
        ORDER BY t.dueDate ASC, t.createdAt ASC
        """)
    Page<Task> findAllWithFilter(
            @Param("filter") String filter,
            @Param("userId") String userId,
            @Param("today") LocalDate today,
            Pageable pageable);

    List<Task> findByContactIdOrderByDueDateAsc(String contactId);

    List<Task> findByDealIdOrderByDueDateAsc(String dealId);

    @Query("""
        SELECT t FROM Task t
        LEFT JOIN FETCH t.assignee
        LEFT JOIN FETCH t.contact
        LEFT JOIN FETCH t.deal
        WHERE t.assignee.id = :userId AND t.status = :status
        ORDER BY t.dueDate ASC
        """)
    List<Task> findDashboardTasksForUser(@Param("userId") String userId,
                                         @Param("status") TaskStatus status,
                                         Pageable pageable);

    long countByAssignee_IdAndDueDateAndStatus(String assigneeId, LocalDate dueDate, TaskStatus status);
}
