# Implementation Plan: Task Management

**Branch**: `005-tasks` | **Date**: 2026-06-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/005-tasks/spec.md`
**Depends on**: `001-auth`, `002-contacts`, `003-deals-pipeline`

---

## Summary

Implement Task management — actionable to-dos with due dates, assignees, and
optional Contact/Deal links. The Tasks list uses Angular signals for local filter
state (tabs: All / My Tasks / Overdue / Due Today / Upcoming / Completed) with
server-side filtering via query params. The complete/reopen toggle is optimistic:
the Task's `status` signal flips immediately on checkbox click; an HTTP PATCH
fires in the background; on error the signal reverts and a toast appears. Create/
Edit and Delete use a 400 px right-slide drawer. Overdue tasks are highlighted in
red; due-today tasks in orange.

---

## Technical Context

**Stack**: Java 21 + Spring Boot 3.3 (`crm-service/`) · Angular 20 (`crm-ui/`)
**New files added to**:
- `crm-service/`: `TaskController`, `TaskService`, `TaskRepository`, `Task` entity
- `crm-ui/`: `tasks/` module (list, drawer, filter tabs)
- Flyway: `V8__create_tasks_table.sql`

**Key dependencies**:
- `001-auth`: JWT filter, User entity (assignee)
- `002-contacts`: Contact entity (nullable FK, `ON DELETE SET NULL`)
- `003-deals-pipeline`: Deal entity (nullable FK, no cascade on deal delete)

**Performance goals**:
- Checkbox toggle visible state change within 100 ms (SC-001, optimistic)
- Filter tab switch updates list within 300 ms (SC-002)

**Constraints**:
- `ON DELETE SET NULL` on `contact_id` FK — Task is preserved when Contact deleted
- Title is required; assignee is required
- No email/push notification to assignee
- Task list paginated at 20 per page
- Overdue = `dueDate < today AND status = PENDING`
- Due today = `dueDate = today AND status = PENDING`
- Upcoming = `dueDate > today AND status = PENDING`

---

## Constitution Check

| Principle | Requirement | Status |
|-----------|-------------|--------|
| I. Spec-Driven | `spec.md` approved; 001–003 complete | ✅ |
| II. Security by Default | All `/api/tasks/**` require JWT | ✅ |
| III. API Contract Integrity | Task lists cached; invalidated on create/update/delete/toggle | ✅ |
| IV. Design System Fidelity | Task list, drawer, overdue/today colour chips match `docs/DESIGN.md` | ✅ |
| V. Data Integrity | Contact deleted → `contact_id` set to NULL on Task; task preserved | ✅ |
| VI. Scope Discipline | No notifications; desktop-only | ✅ |
| VII. Roles & Permissions | Both USER and ADMIN have full Task CRUD | ✅ |

---

## Project Structure — New Files

### crm-service additions
```text
src/main/java/com/aicrm/
└── module/
    └── task/
        ├── Task.java
        ├── TaskStatus.java           # enum: PENDING, COMPLETED
        ├── TaskRepository.java
        ├── TaskService.java
        ├── TaskController.java
        └── dto/
            ├── TaskDto.java
            ├── CreateTaskRequest.java
            ├── UpdateTaskRequest.java
            ├── ToggleTaskRequest.java  # { status: PENDING | COMPLETED }
            └── TaskFilterParams.java   # filter, assigneeId, page
resources/db/migration/
└── V8__create_tasks_table.sql
```

### crm-ui additions
```text
src/app/modules/tasks/
├── tasks.routes.ts
├── tasks-list/
│   ├── tasks-list.component.ts     # filter tabs + optimistic toggle
│   ├── tasks-list.component.html
│   └── tasks-list.component.css
└── task-drawer/
    ├── task-drawer.component.ts    # create + edit
    ├── task-drawer.component.html
    └── task-drawer.component.css
```

---

## Complexity Tracking

| Item | Complexity driver | Mitigation |
|------|-------------------|------------|
| Optimistic toggle revert | Task status must revert on HTTP error | Store pre-toggle status in component; restore in catchError; fire toast |
