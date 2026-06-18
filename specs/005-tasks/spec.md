# Feature Specification: Task Management

**Feature Branch**: `005-tasks`
**Created**: 2026-06-16
**Status**: Draft

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Create a Task (Priority: P1)

A user creates an actionable to-do by entering a title, setting a due date, and assigning it to a
team member. Optionally they link the task to a Contact or Deal.

**Why this priority**: Creating tasks is the entry point to the whole module.

**Independent Test**: Click "New Task" → enter title and due date → assign to self → save → verify
task appears in the task list with correct title, due date, and assignee.

**Acceptance Scenarios**:

1. **Given** a user opens the New Task form, **When** they enter a title (required) and click Save, **Then** the task is created and appears in the task list.
2. **Given** a form with no title, **When** the user tries to save, **Then** an inline error is shown and submission is blocked.
3. **Given** a task linked to a Contact, **When** viewed in the task list, **Then** the linked Contact name is shown on the task row.
4. **Given** a task linked to a Deal, **When** viewed in the task list, **Then** the linked Deal title is shown on the task row.

---

### User Story 2 — Complete / Reopen a Task (Priority: P1)

A user marks a task as complete by clicking its checkbox. The task immediately shows a completed
state (strikethrough, muted). Clicking the checkbox again reopens it. If the server rejects the
change, the task reverts to its previous state.

**Why this priority**: Completing tasks is the most frequent interaction in task management.

**Independent Test**: Find an incomplete task → click checkbox → verify immediate visual change to
completed state. Click checkbox again → verify task returns to incomplete. Simulate server failure
→ verify revert and notification.

**Acceptance Scenarios**:

1. **Given** an incomplete task, **When** the user clicks the checkbox, **Then** the task immediately shows a completed visual state (checkbox checked, title struck through) without waiting for the server.
2. **Given** a completed task, **When** the user clicks the checkbox, **Then** the task returns to an incomplete visual state.
3. **Given** the server rejects the toggle, **When** the error is received, **Then** the task reverts to its previous state and a notification is shown.

---

### User Story 3 — Filter and Browse Tasks (Priority: P1)

A user browses their task list using filter tabs — All, My Tasks, Overdue, Due Today, Upcoming,
Completed — to focus on what matters most.

**Why this priority**: The unfiltered list becomes unmanageable quickly; filters are essential from
day one.

**Independent Test**: With a mix of overdue, due-today, upcoming, and completed tasks present → click
"Overdue" tab → verify only overdue incomplete tasks show → click "My Tasks" → verify only tasks
assigned to the current user show.

**Acceptance Scenarios**:

1. **Given** a user clicks the "Overdue" tab, **When** the list updates, **Then** only incomplete tasks with a due date in the past are shown, and their due date chips are highlighted in red.
2. **Given** a user clicks the "Due Today" tab, **When** the list updates, **Then** only incomplete tasks due on the current calendar day are shown, with orange due date chips.
3. **Given** a user clicks the "My Tasks" tab, **When** the list updates, **Then** only tasks assigned to the currently logged-in user are shown.
4. **Given** a user clicks the "Completed" tab, **When** the list updates, **Then** only completed tasks are shown.
5. **Given** a user clicks the "All" tab, **When** the list updates, **Then** all tasks (all assignees, all statuses) are shown.

---

### User Story 4 — Edit and Delete a Task (Priority: P2)

A user updates a task's title, due date, assignee, or linked Contact/Deal. They can also delete a
task they no longer need, after confirming.

**Why this priority**: Tasks change over time; editing and cleanup are standard lifecycle actions.

**Independent Test**: Open an existing task → change the due date → save → verify updated date
appears. Click Delete → confirm → verify task is removed from all views.

**Acceptance Scenarios**:

1. **Given** an existing task, **When** a user opens it and changes the due date, **Then** the updated due date is reflected in the task list and any related colour-coding (overdue/today) updates accordingly.
2. **Given** a user initiates task deletion, **When** the confirmation dialog appears, **Then** clicking Cancel leaves the task unchanged.
3. **Given** the user confirms deletion, **When** the action completes, **Then** the task no longer appears in any filter view.

---

### Edge Cases

- What happens to a task when the Contact it is linked to is deleted? (Contact reference is cleared; task is preserved.)
- Can a task be assigned to a deactivated user?
- What if the due date is set in the past at creation time — is that allowed?
- How many tasks can appear on one page before pagination is needed?

---

## Requirements *(mandatory)*

### Functional Requirements

- **TSK-01**: Users MUST be able to create a Task with: title (required), description, due date, assignee (team member, required), and optional links to a Contact and/or Deal.
- **TSK-02**: Users MUST be able to mark a Task complete or incomplete via a single click; the toggle MUST apply optimistically and revert on server failure with a notification.
- **TSK-03**: Users MUST be able to edit any field of a Task.
- **TSK-04**: Users MUST be able to delete a Task after confirming a prompt.
- **TSK-05**: The Tasks list MUST support filter tabs: All, My Tasks, Overdue, Due Today, Upcoming, Completed.
- **TSK-06**: Overdue incomplete tasks MUST be visually highlighted (red due date indicator).
- **TSK-07**: Tasks due today MUST be visually distinguished (orange due date indicator).
- **TSK-08**: When a linked Contact is deleted, the Task MUST be preserved with its Contact reference cleared.

### Key Entities

- **Task** — An actionable to-do item. Key attributes: title, description, due date, completion status, assigned team member (owner), optional linked Contact, optional linked Deal.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A task checkbox toggle produces a visible state change within 100 ms (optimistic update; no server wait).
- **SC-002**: Switching between filter tabs updates the task list within 300 ms.
- **SC-003**: Overdue tasks are visually distinguishable from non-overdue tasks at a glance — confirmed by user inspection with no documentation needed.
- **SC-004**: 100% of task deletions are preceded by a confirmation dialog.
- **SC-005**: A task created with a linked Contact appears on that Contact's detail page task section without any additional action.

---

## Assumptions

- Due date is a required field at creation time; time component (hour/minute) is optional.
- A task can only be assigned to one team member at a time.
- Tasks can be assigned to any active user, not just the logged-in user.
- Assigning a task to a deactivated user is not prevented at create/edit time (the assignee field simply retains the previous user reference); this edge case is handled in a future release.
- The task list is paginated consistently with other lists (20 per page).
- "Upcoming" filter shows tasks due in the future that are not yet overdue and not due today.
- Tasks do not send email or push notifications to assignees in this release.
