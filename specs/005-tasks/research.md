# Research: Task Management

**Feature**: `005-tasks` | **Date**: 2026-06-16

> Stack decisions established in `001-auth/research.md`. This file documents module-specific decisions.

---

## Decision 1: Optimistic Toggle Pattern

**Decision**: Angular component stores a per-task `signal<TaskStatus>` in a local `Map`; flips immediately on checkbox click; HTTP PATCH fires concurrently; reverts on `catchError`

**Rationale**:
- Constitution principle IV requires optimistic UI for task-complete toggle
- 100 ms visual response (SC-001) is incompatible with waiting for the server
- Implementation: `tasksSignal` is a `signal<TaskDto[]>`; on toggle:
  1. `tasksSignal.update(list => list.map(t => t.id === id ? {...t, status: newStatus} : t))`
  2. `http.patch(...).pipe(catchError(() => { tasksSignal.update(revert); showToast(); }))`
- The Angular `effect()` listening to `tasksSignal` re-renders the task row with
  checked/unchecked state within one microtask (< 16 ms)

---

## Decision 2: Filter Tab Strategy

**Decision**: Filter state stored as a URL query param (`?filter=overdue`); backend resolves it into a `WHERE` clause

**Rationale**:
- URL-based filters are bookmarkable and survive page refresh
- Angular Router `queryParams` observable updates the filter; component makes a new
  HTTP request with the filter value
- Backend `TaskService.findAll(filter, userId, pageable)` switches on filter:
  - `OVERDUE` → `dueDate < CURRENT_DATE AND status = 'PENDING'`
  - `TODAY` → `dueDate = CURRENT_DATE AND status = 'PENDING'`
  - `UPCOMING` → `dueDate > CURRENT_DATE AND status = 'PENDING'`
  - `MY_TASKS` → `assignee_id = currentUserId AND status = 'PENDING'`
  - `COMPLETED` → `status = 'COMPLETED'`
  - `ALL` → no extra predicate

---

## Decision 3: Due Date Colour Coding

**Decision**: Colour determined client-side by comparing `dueDate` to today's date; no server-side computed field

**Rationale**:
- Colour (red/orange/grey) is a presentational concern; computing it on the backend
  ties the backend to a client display rule that may change
- Angular pipe `DueDateColorPipe` transforms `dueDate: string` + `status`:
  - `PENDING` + `dueDate < today` → `--color-error` (red)
  - `PENDING` + `dueDate = today` → `--color-warning` (orange)
  - Otherwise → `--color-text-muted` (grey)

---

## Decision 4: Contact Reference Preservation on Delete

**Decision**: `ON DELETE SET NULL` FK on `tasks.contact_id`; no application-layer logic needed

**Rationale**:
- Constitution principle V and TSK-08 define this semantics explicitly
- DB constraint handles the case atomically when Contact hard-delete fires
- `TaskDto.contactId` and `TaskDto.contactName` become `null` on the frontend;
  the task row renders without a contact chip

---

## Decision 5: Task Cache Strategy

**Decision**: Cache tasks per filter+page: `tasks::filter::{filter}::page::{page}`; invalidate all task cache entries on any task write

**Rationale**:
- Filter tabs map to separate cache entries; switching tabs needs fresh data per filter
- `@CacheEvict(value = "tasks", allEntries = true)` on create/update/delete/toggle
  is the simplest correct strategy — task mutations affect multiple filter views
  (e.g., completing a task moves it from OVERDUE to COMPLETED)

---

## Summary

| Area | Decision |
|------|----------|
| Optimistic toggle | Signal update → HTTP PATCH → revert signal on error + toast |
| Filter tabs | URL query param `?filter=`; server-side `WHERE` clause switch |
| Due date colour | Client-side `DueDateColorPipe`; no server computed field |
| Contact deletion | DB `ON DELETE SET NULL`; task preserved with `contactId = null` |
| Cache keys | `tasks::filter::{filter}::page::{n}`; `@CacheEvict(allEntries=true)` on any write |
