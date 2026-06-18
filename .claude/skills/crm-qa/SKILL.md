---
name: "crm-qa"
description: "Systematically verify the running AI-CRM application against the acceptance criteria in each module's spec.md. Walks through every user story scenario and reports pass/fail per story."
argument-hint: "Optional: module number or name (e.g. '001', 'auth', 'contacts', 'deals', 'activities', 'tasks', 'dashboard', 'admin'). Default: all modules in order."
user-invocable: true
disable-model-invocation: false
---

## User Input

```text
$ARGUMENTS
```

Run QA verification for the specified module, or all modules if no argument given.

## Prerequisites

The full stack MUST be running before QA begins. If not running, start it:

```
/crm-run
```

Verify both services are up before proceeding:
- Backend: `GET http://localhost:5000/api/auth/login` returns any HTTP response (even 401/422)
- Frontend: `GET http://localhost:3000` returns HTML

If either is unreachable, stop and instruct the user to run `/crm-run` first.

## QA Approach

For each module:
1. Read the module's `spec.md` acceptance scenarios
2. Execute each scenario against the running app (via API calls for backend, browser observation for frontend)
3. Record PASS / FAIL / SKIP per scenario
4. Report a summary with counts and any failure details

Use `Invoke-WebRequest` (PowerShell) for API-level checks. Report what you observe for UI-level checks.

---

## Module 001: Authentication & User Management

**Spec**: `specs/001-auth/spec.md`

### Pre-condition: obtain a valid JWT

```powershell
$loginBody = '{"email":"admin@aicrm.local","password":"Admin1234!"}'
$loginResp = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" `
    -Method POST -Body $loginBody -ContentType "application/json"
$token = ($loginResp.Content | ConvertFrom-Json).token
$headers = @{ Authorization = "Bearer $token" }
```

### US1 — Sign In

- [ ] **SC1.1** Valid credentials → 200 + token returned
  ```powershell
  # Already done above. Verify $loginResp.StatusCode -eq 200 and $token is non-empty
  ```
- [ ] **SC1.2** Wrong password → 401 with code `AUTH_FAILED`, no field hint
  ```powershell
  try {
      Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" -Method POST `
          -Body '{"email":"admin@aicrm.local","password":"wrongpassword"}' `
          -ContentType "application/json"
  } catch {
      $err = $_.Exception.Response
      # Verify: StatusCode = 401, body.error.code = "AUTH_FAILED"
      # Verify: body.error.message does NOT contain "password" or "email" separately
  }
  ```
- [ ] **SC1.3** Wrong email → same generic `AUTH_FAILED` as SC1.2 (identical message)
- [ ] **SC1.4** `GET /api/auth/me` without token → 401 `UNAUTHORIZED`
  ```powershell
  try { Invoke-WebRequest -Uri "http://localhost:5000/api/auth/me" } catch { <# expect 401 #> }
  ```

### US2 — Sign Out (client-side only)

- [ ] **SC2.1** After logout, `GET /api/auth/me` with cleared token → 401 (server correctly rejects; client cleared localStorage)
- [ ] **SC2.2** Protected route navigation after logout redirects to `/login` (observe in browser)

### US3 — Update Own Profile

- [ ] **SC3.1** `PUT /api/auth/profile` with valid displayName → 200 + updated name returned
  ```powershell
  $body = '{"displayName":"QA Tester"}'
  $resp = Invoke-WebRequest -Uri "http://localhost:5000/api/auth/profile" `
      -Method PUT -Body $body -ContentType "application/json" -Headers $headers
  # Verify: $resp.StatusCode -eq 200, returned displayName = "QA Tester"
  ```
- [ ] **SC3.2** `PUT /api/auth/password` with correct currentPassword and valid newPassword → 200
- [ ] **SC3.3** `PUT /api/auth/password` with newPassword < 8 chars → 422 `VALIDATION_ERROR`

---

## Module 002: Contact Management

**Spec**: `specs/002-contacts/spec.md`

### US1 — Create a Contact

- [ ] **SC1.1** `POST /api/contacts` with firstName + lastName → 201 + ContactDto
  ```powershell
  $body = '{"firstName":"Jane","lastName":"Smith","email":"jane@test.com"}'
  $resp = Invoke-WebRequest -Uri "http://localhost:5000/api/contacts" `
      -Method POST -Body $body -ContentType "application/json" -Headers $headers
  $contactId = ($resp.Content | ConvertFrom-Json).id
  # Verify: StatusCode = 201
  ```
- [ ] **SC1.2** Missing firstName → 422 `VALIDATION_ERROR` with `firstName` field error
- [ ] **SC1.3** Invalid email format → 422 `VALIDATION_ERROR` with `email` field error
- [ ] **SC1.4** New contact appears in `GET /api/contacts` response

### US2 — Search and Filter Contacts

- [ ] **SC2.1** `GET /api/contacts?search=Jane` returns only matching contacts
- [ ] **SC2.2** `GET /api/contacts?search=nomatch_xyz` returns empty `content` array
- [ ] **SC2.3** `GET /api/contacts?tagId={validTagId}` returns only contacts with that tag

### US3 — View Contact Detail

- [ ] **SC3.1** `GET /api/contacts/{id}` returns full ContactDto with all fields
- [ ] **SC3.2** `GET /api/contacts/{nonExistentId}` → 404 `NOT_FOUND`

### US4 — Edit a Contact

- [ ] **SC4.1** `PUT /api/contacts/{id}` with changed phone → 200 + updated ContactDto
- [ ] **SC4.2** `PUT /api/contacts/{id}` with empty firstName → 422 `VALIDATION_ERROR`

### US5 — Delete a Contact

- [ ] **SC5.1** `DELETE /api/contacts/{id}` → 204 no body
- [ ] **SC5.2** After delete, `GET /api/contacts/{id}` → 404
- [ ] **SC5.3** Verify linked activities also deleted (check `GET /api/activities?contactId={id}` returns empty)
- [ ] **SC5.4** Verify linked tasks preserved with contactId cleared (check task's `contactId` is null)

---

## Module 003: Deals Pipeline

**Spec**: `specs/003-deals-pipeline/spec.md`

### US1 — View Pipeline Board

- [ ] **SC1.1** `GET /api/deals/board` returns DealBoardDto with all 6 stage keys
  ```powershell
  $board = (Invoke-WebRequest -Uri "http://localhost:5000/api/deals/board" -Headers $headers).Content | ConvertFrom-Json
  $expectedStages = @("LEAD","QUALIFIED","PROPOSAL","NEGOTIATION","CLOSED_WON","CLOSED_LOST")
  $expectedStages | ForEach-Object { if (-not $board.stages.$_) { Write-Warning "Missing stage: $_" } }
  ```
- [ ] **SC1.2** CLOSED_LOST cards present in board response (visual muting verified in browser)

### US2 — Create a Deal

- [ ] **SC2.1** `POST /api/deals` with title + stage → 201 + DealDto
- [ ] **SC2.2** Missing title → 422 `VALIDATION_ERROR`
- [ ] **SC2.3** New deal appears in correct stage bucket of `GET /api/deals/board`

### US3 — Move a Deal

- [ ] **SC3.1** `PATCH /api/deals/{id}/stage` with new stage → 200 + updated DealDto
- [ ] **SC3.2** Board reflects deal in new stage after move

### US4 — Edit a Deal

- [ ] **SC4.1** `PUT /api/deals/{id}` with updated value → 200 + updated DealDto
- [ ] **SC4.2** Missing title in PUT → 422 `VALIDATION_ERROR`

### US5 — Delete a Deal

- [ ] **SC5.1** `DELETE /api/deals/{id}` → 204
- [ ] **SC5.2** Deal no longer in board response

---

## Module 004: Activity Logging

**Spec**: `specs/004-activities/spec.md`

### US1 — Log an Activity

- [ ] **SC1.1** `POST /api/activities` with type + subject + contactId → 201 + ActivityDto with author set server-side
  ```powershell
  $body = "{`"type`":`"CALL`",`"subject`":`"QA test call`",`"contactId`":`"$contactId`"}"
  $resp = Invoke-WebRequest -Uri "http://localhost:5000/api/activities" `
      -Method POST -Body $body -ContentType "application/json" -Headers $headers
  $activityId = ($resp.Content | ConvertFrom-Json).id
  # Verify: authorId is set (not null), authorName matches logged-in user
  ```
- [ ] **SC1.2** Missing subject → 422 `VALIDATION_ERROR`
- [ ] **SC1.3** Author is set from JWT (not from request body) — verify by checking authorId = admin user id

### US2 — View Activity Feed

- [ ] **SC2.1** `GET /api/activities?contactId={id}` returns activities in reverse-chronological order
- [ ] **SC2.2** Empty contact → empty page response (not 404)

### US3 — Global Activity Feed

- [ ] **SC3.1** `GET /api/activities` returns all activities paginated
- [ ] **SC3.2** `GET /api/activities?type=CALL` returns only CALL activities
- [ ] **SC3.3** `GET /api/activities?dateFrom=2026-01-01&dateTo=2026-12-31` returns activities in range

### US4 — Delete an Activity

- [ ] **SC4.1** `DELETE /api/activities/{id}` → 204
- [ ] **SC4.2** Activity no longer in contact feed or global feed

---

## Module 005: Task Management

**Spec**: `specs/005-tasks/spec.md`

### US1 — Create a Task

- [ ] **SC1.1** `POST /api/tasks` with title + dueDate + assigneeId → 201 + TaskDto
- [ ] **SC1.2** Missing title → 422 `VALIDATION_ERROR`
- [ ] **SC1.3** Task with contactId → contact name shown in TaskDto

### US2 — Complete / Reopen a Task

- [ ] **SC2.1** `PATCH /api/tasks/{id}/status` with `{"status":"COMPLETED"}` → 200 + status = COMPLETED
- [ ] **SC2.2** `PATCH /api/tasks/{id}/status` with `{"status":"PENDING"}` → 200 + status = PENDING

### US3 — Filter Tasks

- [ ] **SC3.1** `GET /api/tasks?filter=OVERDUE` returns only PENDING tasks with dueDate < today
- [ ] **SC3.2** `GET /api/tasks?filter=TODAY` returns only PENDING tasks with dueDate = today
- [ ] **SC3.3** `GET /api/tasks?filter=MY_TASKS` returns only tasks assigned to the JWT user
- [ ] **SC3.4** `GET /api/tasks?filter=COMPLETED` returns only COMPLETED tasks

### US4 — Edit and Delete a Task

- [ ] **SC4.1** `PUT /api/tasks/{id}` with new dueDate → 200 + updated TaskDto
- [ ] **SC4.2** `DELETE /api/tasks/{id}` → 204
- [ ] **SC4.3** Deleted task absent from all filter queries

---

## Module 006: Dashboard

**Spec**: `specs/006-dashboard/spec.md`

### US1 — Personal Snapshot

- [ ] **SC1.1** `GET /api/dashboard/summary` → 200 with all 4 widget keys present
  ```powershell
  $dash = (Invoke-WebRequest -Uri "http://localhost:5000/api/dashboard/summary" -Headers $headers).Content | ConvertFrom-Json
  # Verify: $dash.metrics, $dash.pipelineSummary, $dash.myTasks, $dash.recentActivity all present
  ```
- [ ] **SC1.2** `metrics.openDeals` count matches `GET /api/deals/board` deal count (excluding CLOSED_WON + CLOSED_LOST)
- [ ] **SC1.3** `metrics.todayTasks` matches `GET /api/tasks?filter=TODAY` total
- [ ] **SC1.4** `myTasks` list has ≤ 5 entries, all PENDING, all assigned to current user
- [ ] **SC1.5** `recentActivity` list has ≤ 10 entries, sorted by createdAt DESC

---

## Module 007: Admin — User & Tag Management

**Spec**: `specs/007-admin/spec.md`

### Pre-condition: use Admin JWT (already obtained in Module 001 setup)

### US1 — Invite a New Team Member

- [ ] **SC1.1** `POST /api/admin/users` → 201 + UserDto; new user can then login
  ```powershell
  $body = '{"displayName":"QA User","email":"qauser@aicrm.local","password":"QaPass123!","role":"USER"}'
  $resp = Invoke-WebRequest -Uri "http://localhost:5000/api/admin/users" `
      -Method POST -Body $body -ContentType "application/json" -Headers $headers
  $newUserId = ($resp.Content | ConvertFrom-Json).id
  ```
- [ ] **SC1.2** Duplicate email → 409 `CONFLICT`
- [ ] **SC1.3** Missing name → 422 `VALIDATION_ERROR`

### US2 — Manage Roles and Status

- [ ] **SC2.1** `PUT /api/admin/users/{id}/role` with `{"role":"ADMIN"}` → 200
- [ ] **SC2.2** `PUT /api/admin/users/{id}/status` with `{"status":"INACTIVE"}` → 200; login attempt with that user → 401 `AUTH_FAILED`
- [ ] **SC2.3** Self-deactivation → 400/403 error (cannot deactivate own account)
- [ ] **SC2.4** Demote last admin → 409 error (last admin lock-out prevention)

### US3 — Tags

- [ ] **SC3.1** `POST /api/admin/tags` with name + colour → 201 + TagDto
- [ ] **SC3.2** Missing name → 422 `VALIDATION_ERROR`
- [ ] **SC3.3** `DELETE /api/admin/tags/{id}` → 204; tag no longer returned by `GET /api/companies` (contacts tag picker)

### US4 — Access Control

- [ ] **SC4.1** Call any `POST /api/admin/**` with a USER-role JWT → 403 `FORBIDDEN`
  ```powershell
  # Get USER-role token (login as QA User created in SC1.1 after re-activating)
  # Then try: POST /api/admin/users → must return 403
  ```

---

## QA Summary Report

After all checks, output a structured summary:

```
AI-CRM QA Report
================
Date: {current date/time}
Stack: http://localhost:5000 (BE) · http://localhost:3000 (FE)

Module            | Pass | Fail | Skip | Result
------------------|------|------|------|-------
001-auth          |  7   |  0   |  0   | ✅ PASS
002-contacts      |  9   |  0   |  0   | ✅ PASS
003-deals-pipeline|  7   |  0   |  0   | ✅ PASS
004-activities    |  8   |  0   |  0   | ✅ PASS
005-tasks         |  8   |  0   |  0   | ✅ PASS
006-dashboard     |  5   |  0   |  0   | ✅ PASS
007-admin         |  8   |  0   |  0   | ✅ PASS
------------------|------|------|------|-------
TOTAL             | 52   |  0   |  0   | ✅ ALL PASS

Failed scenarios:
(none)

Notes:
- UI/browser checks (optimistic drag, toast behaviour, colour-coded due dates) are marked
  SKIP when stack is API-only; run with /crm-run and verify manually in browser.
- Re-run specific module: /crm-qa contacts
```

## Cleanup after QA

Remove any test data created during QA run (contacts, deals, tasks, activities, users, tags created with "QA" prefix) to leave the DB in a clean state for the next QA run.
