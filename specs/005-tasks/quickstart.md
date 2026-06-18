# Quickstart & Validation Guide: Task Management

**Feature**: `005-tasks` | **Date**: 2026-06-16

**Prerequisites**: `001-auth`, `002-contacts`, `003-deals-pipeline` complete and running.

---

## Setup

Flyway migration V8 runs automatically on startup:
- V8: `tasks` table (FK to `users`, `contacts` ON DELETE SET NULL, `deals`)

---

## Validation Scenarios

### Scenario 1 — Create a Task (US1)

1. Log in → navigate to `http://localhost:3000/tasks`
2. Click "New Task" → drawer opens
3. Enter title "Send proposal", set due date, assign to self
4. Click Save → **Expected**: task appears in the "All" tab list

### Scenario 2 — Required Field Validation (US1)

1. Open New Task drawer → leave title blank → click Save
2. **Expected**: inline error "Title is required"
3. Leave due date blank → **Expected**: inline error "Due date is required"

### Scenario 3 — Optimistic Complete Toggle (US2, SC-001)

1. Find an incomplete task (PENDING)
2. Click the checkbox → **Expected**: task IMMEDIATELY shows completed state (strikethrough, checkbox checked) with NO network wait
3. Check DevTools Network tab → HTTP PATCH fires concurrently (not before)
4. Click checkbox again → **Expected**: task immediately returns to PENDING state

### Scenario 4 — Optimistic Revert on Server Error

1. Temporarily kill the backend (`Ctrl+C`)
2. Click a task checkbox
3. **Expected**: task flips to completed state; then after ~3 s reverts to PENDING
4. **Expected**: error toast appears
5. Restart the backend

### Scenario 5 — Filter Tabs (US3, SC-002)

1. Create tasks covering multiple states:
   - One with due date yesterday (overdue)
   - One with due date today
   - One with due date next week
   - Mark one as completed
2. Click "Overdue" tab → **Expected**: only the past-due PENDING task shows; due date chip is red
3. Click "Due Today" tab → **Expected**: only today's PENDING task shows; orange chip
4. Click "Upcoming" tab → **Expected**: only the next-week task shows
5. Click "Completed" tab → **Expected**: only the completed task shows
6. Click "My Tasks" → **Expected**: only tasks assigned to current user (PENDING)
7. Click "All" → **Expected**: all tasks visible

### Scenario 6 — Edit a Task (US4)

1. Open a task from the list → drawer opens with all fields populated
2. Change due date → click Save → **Expected**: updated due date visible; colour coding updates

### Scenario 7 — Delete a Task (US4, SC-004)

1. Click Delete on a task → **Expected**: confirmation dialog
2. Cancel → **Expected**: task unchanged
3. Confirm → **Expected**: task gone from all filter views

### Scenario 8 — Contact Deletion Preserves Task (TSK-08)

1. Create a contact → link a task to that contact
2. Delete the contact (confirm deletion)
3. Navigate back to Tasks list → **Expected**: the task still exists; contact name is blank

---

## API Smoke Tests

```powershell
$res = Invoke-RestMethod -Uri http://localhost:5000/api/auth/login -Method POST -ContentType "application/json" -Body '{"email":"admin@aicrm.local","password":"Admin1234!"}'
$token = $res.token

# Create task (replace assigneeId with actual admin user id)
$task = '{"title":"Test task","dueDate":"2026-06-20","assigneeId":"00000000-0000-0000-0000-000000000001"}'
$t = Invoke-RestMethod -Uri http://localhost:5000/api/tasks -Method POST -ContentType "application/json" -Headers @{ Authorization = "Bearer $token" } -Body $task
$taskId = $t.id

# List with filter
Invoke-RestMethod -Uri "http://localhost:5000/api/tasks?filter=ALL" -Headers @{ Authorization = "Bearer $token" }

# Toggle complete
Invoke-RestMethod -Uri "http://localhost:5000/api/tasks/$taskId/toggle" -Method PATCH -ContentType "application/json" -Headers @{ Authorization = "Bearer $token" } -Body '{"status":"COMPLETED"}'

# Delete
Invoke-RestMethod -Uri "http://localhost:5000/api/tasks/$taskId" -Method DELETE -Headers @{ Authorization = "Bearer $token" }
```

---

## Sign-Off Checklist

- [ ] Checkbox toggle produces visible state change within 100 ms (no server wait)
- [ ] Optimistic revert fires on backend error with error toast
- [ ] Filter tab "Overdue" shows only past-due PENDING tasks with red chip
- [ ] Filter tab "Due Today" shows only today's PENDING tasks with orange chip
- [ ] "My Tasks" shows only current user's tasks
- [ ] "All" tab shows every task regardless of assignee or status
- [ ] Delete shows confirmation dialog; task removed from all filter views
- [ ] Deleting a Contact sets `contact_id = NULL` on linked tasks (tasks preserved)
- [ ] `tasks::*` Redis cache evicted after any task mutation
