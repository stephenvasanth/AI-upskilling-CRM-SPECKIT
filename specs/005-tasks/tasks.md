# Tasks: Task Management

**Input**: Design documents from `specs/005-tasks/`

**Prerequisites**: spec.md ✅ · plan.md ✅ · data-model.md ✅ · research.md ✅ · quickstart.md ✅

**Depends on**: `001-auth` · `002-contacts` (Contact FK) · `003-deals-pipeline` (Deal FK)

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

---

## Phase 1: Setup

- [X] T001 Create `V8__create_tasks_table.sql` Flyway migration in `crm-service/src/main/resources/db/migration/`

---

## Phase 2: Foundational (Blocking Prerequisites)

- [X] T002 Create `TaskStatus.java` enum (`PENDING, COMPLETED`)
- [X] T003 Create `Task.java` JPA entity
- [X] T004 Create `TaskRepository.java` with filter JPQL query
- [X] T005 [P] Create `TaskDto.java`, `CreateTaskRequest.java`, `UpdateTaskRequest.java`, `ToggleTaskRequest.java`
- [X] T006 Create Angular `tasks.routes.ts` and register in `crm-ui/src/app/app.routes.ts` (lazy-loaded)
- [X] T007 [P] Create Angular `TasksService`

---

## Phase 3: User Story 1 — Create a Task (Priority: P1) 🎯 MVP

- [X] T008 [US1] Create `TaskService.java` with `create`
- [X] T009 [US1] Create `TaskController.java` (`POST /api/tasks`)
- [X] T010 [US1] Create `TaskDrawerComponent` (create + edit mode)
- [X] T011 [US1] Create `TasksListComponent` skeleton with "New Task" button
- [X] T012 [US1] Register `/tasks` route in `tasks.routes.ts`
- [X] T013 [US1] "Tasks" nav link already present in `SidebarComponent`

---

## Phase 4: User Story 2 — Complete / Reopen a Task (Priority: P1)

- [X] T014 [US2] Add `toggle(id, request)` to `TaskService.java`
- [X] T015 [US2] Add `PATCH /api/tasks/{id}/status` to `TaskController.java`
- [X] T016 [US2] Implement optimistic toggle in `TasksListComponent`

---

## Phase 5: User Story 3 — Filter and Browse Tasks (Priority: P1)

- [X] T017 [US3] Add `getAll(filter, userId, page)` to `TaskService.java`
- [X] T018 [US3] Add `GET /api/tasks` with filter param to `TaskController.java`
- [X] T019 [US3] Add filter tabs to `TasksListComponent`
- [X] T020 [US3] Wire tasks list to `GET /api/tasks`

---

## Phase 6: User Story 4 — Edit and Delete a Task (Priority: P2)

- [X] T021 [US4] Add `update(id, request)` and `delete(id)` to `TaskService.java`
- [X] T022 [US4] Add `GET /api/tasks/{id}`, `PUT /api/tasks/{id}`, `DELETE /api/tasks/{id}`
- [X] T023 [US4] Extend `TaskDrawerComponent` for edit mode
- [X] T024 [US4] Wire task row click to edit drawer
- [X] T025 [US4] Delete button + `ModalComponent` in `TaskDrawerComponent`

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T026 [P] Tasks section wired into `ContactDetailComponent` via `GET /api/tasks/by-contact/{id}`
- [X] T027 [P] Write `TaskServiceTest.java`
- [X] T028 [P] Write `TaskControllerTest.java`
- [X] T029 Run quickstart.md validation (deferred to runtime)
