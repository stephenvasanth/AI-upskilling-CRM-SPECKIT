# Data Model: Task Management

**Feature**: `005-tasks` | **Date**: 2026-06-16

> Introduces: `Task` entity, `TaskStatus` enum.
> Migration continues from V7 (activities).

---

## Enum: TaskStatus

```java
public enum TaskStatus {
    PENDING,
    COMPLETED
}
```

Stored as `VARCHAR(10)` in the database.

---

## Entity: Task

| Field | Java Type | DB Column | Constraints |
|-------|-----------|-----------|-------------|
| `id` | `String` | `id` | PK, `VARCHAR(36)`, UUID |
| `title` | `String` | `title` | `VARCHAR(255)`, NOT NULL |
| `description` | `String` | `description` | `TEXT`, nullable |
| `dueDate` | `LocalDate` | `due_date` | `DATE`, NOT NULL |
| `status` | `TaskStatus` | `status` | `VARCHAR(10)`, NOT NULL, default `'PENDING'` |
| `assigneeId` | `String` | `assignee_id` | FK → `users.id`, NOT NULL, `ON DELETE SET NULL` |
| `contactId` | `String` | `contact_id` | FK → `contacts.id`, nullable, `ON DELETE SET NULL` |
| `dealId` | `String` | `deal_id` | FK → `deals.id`, nullable, `ON DELETE SET NULL` |
| `createdAt` | `Instant` | `created_at` | `TIMESTAMPTZ`, NOT NULL |
| `updatedAt` | `Instant` | `updated_at` | `TIMESTAMPTZ`, NOT NULL |

> `contact_id ON DELETE SET NULL`: when a Contact is hard-deleted, linked Tasks
> are preserved with `contactId` set to null (TSK-08, constitution principle V).
> `deal_id ON DELETE SET NULL`: Deal deletion orphans the task's deal link.

### JPA Entity

```java
@Entity @Table(name = "tasks") @Getter @Setter @NoArgsConstructor
public class Task {
    @Id @Column(name = "id", length = 36) private String id;

    @Column(name = "title", length = 255, nullable = false) private String title;
    @Column(name = "description", columnDefinition = "TEXT") private String description;
    @Column(name = "due_date", nullable = false) private LocalDate dueDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 10, nullable = false)
    private TaskStatus status = TaskStatus.PENDING;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignee_id") private User assignee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contact_id") private Contact contact;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deal_id") private Deal deal;

    @CreationTimestamp @Column(name = "created_at", updatable = false) private Instant createdAt;
    @UpdateTimestamp   @Column(name = "updated_at")                    private Instant updatedAt;

    @PrePersist
    private void generateId() { if (id == null) id = UUID.randomUUID().toString(); }
}
```

### Flyway: V8

```sql
CREATE TABLE IF NOT EXISTS tasks (
    id           VARCHAR(36)  PRIMARY KEY,
    title        VARCHAR(255) NOT NULL,
    description  TEXT,
    due_date     DATE         NOT NULL,
    status       VARCHAR(10)  NOT NULL DEFAULT 'PENDING',
    assignee_id  VARCHAR(36)  REFERENCES users(id)    ON DELETE SET NULL,
    contact_id   VARCHAR(36)  REFERENCES contacts(id) ON DELETE SET NULL,
    deal_id      VARCHAR(36)  REFERENCES deals(id)    ON DELETE SET NULL,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks (assignee_id, due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_contact  ON tasks (contact_id);
CREATE INDEX IF NOT EXISTS idx_tasks_deal     ON tasks (deal_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status   ON tasks (status, due_date);
```

---

## DTOs

```java
public record TaskDto(
    String    id,
    String    title,
    String    description,
    LocalDate dueDate,
    String    status,       // "PENDING" or "COMPLETED"
    String    assigneeId,
    String    assigneeName,
    String    contactId,    // null if contact deleted
    String    contactName,
    String    dealId,
    String    dealTitle,
    Instant   createdAt,
    Instant   updatedAt
) {}

public record CreateTaskRequest(
    @NotBlank @Size(max=255) String    title,
                             String    description,
    @NotNull                 LocalDate dueDate,
    @NotBlank                String    assigneeId,
                             String    contactId,
                             String    dealId
) {}

public record UpdateTaskRequest(
    @NotBlank @Size(max=255) String    title,
                             String    description,
    @NotNull                 LocalDate dueDate,
    @NotBlank                String    assigneeId,
                             String    contactId,
                             String    dealId
) {}

public record ToggleTaskRequest(
    @NotNull TaskStatus status
) {}
```

---

## Filter Enum (backend)

```java
public enum TaskFilter {
    ALL, MY_TASKS, OVERDUE, TODAY, UPCOMING, COMPLETED
}
```

Backend SQL logic per filter (relative to `CURRENT_DATE`):

| Filter | Additional WHERE clause |
|--------|------------------------|
| `ALL` | — |
| `MY_TASKS` | `assignee_id = :userId AND status = 'PENDING'` |
| `OVERDUE` | `due_date < CURRENT_DATE AND status = 'PENDING'` |
| `TODAY` | `due_date = CURRENT_DATE AND status = 'PENDING'` |
| `UPCOMING` | `due_date > CURRENT_DATE AND status = 'PENDING'` |
| `COMPLETED` | `status = 'COMPLETED'` |

---

## Redis Cache Keys

| Key | Value | TTL | Invalidated on |
|-----|-------|-----|----------------|
| `tasks::filter::{filter}::page::{n}` | `Page<TaskDto>` | 24 h | Any task write (create/update/delete/toggle) |
| `tasks::contact::{id}` | `List<TaskDto>` | 24 h | Task create/update/delete involving that contact |

> `@CacheEvict(value = "tasks", allEntries = true)` is used on all task mutations
> because filter changes cross-cut multiple filter buckets.

---

## State Transitions

```
[Create → PENDING]
      ↓        ↑
  [Toggle]  [Toggle]
      ↓
  COMPLETED
      ↓
  [Delete] → removed from all filter views
```
