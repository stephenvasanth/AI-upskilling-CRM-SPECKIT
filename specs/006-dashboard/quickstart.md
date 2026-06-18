# Quickstart & Validation Guide: Dashboard

**Feature**: `006-dashboard` | **Date**: 2026-06-16

**Prerequisites**: All modules 001–005 complete and running. At least one Contact,
Deal, Activity, and Task must exist in the system to validate all widgets.

---

## Setup

No new migrations. The Dashboard queries existing tables from modules 001–005.

---

## Validation Scenarios

### Scenario 1 — Default Landing Page (US1, DSH-01)

1. Log in → observe URL immediately after login
2. **Expected**: browser URL is `http://localhost:3000/dashboard`
3. **Expected**: all four widget sections are visible within 2 seconds

### Scenario 2 — Metric Cards (US1, DSH-02, SC-001, SC-002)

1. Count open deals manually (not CLOSED_WON, not CLOSED_LOST)
2. View the "Open Deals" metric card → **Expected**: count matches; pipeline value matches
3. Count your tasks due today → view "My Tasks Due Today" card → **Expected**: count matches
4. Count contacts created in the last 7 days → view "New Contacts" card → **Expected**: matches

### Scenario 3 — Pipeline Summary (DSH-03)

1. View the Pipeline Summary section
2. **Expected**: bars or indicators for Lead, Qualified, Proposal, Negotiation, Closed Won — NOT Closed Lost
3. Each bar proportional to deal count in that stage
4. With zero deals in any stage: that stage still shown with zero/empty bar

### Scenario 4 — My Tasks Widget (DSH-04, DSH-05, SC-003)

1. Mark ALL incomplete tasks as completed
2. Refresh the Dashboard
3. **Expected**: My Tasks widget shows empty state "No tasks due" (no completed tasks shown)
4. Create a new task assigned to yourself with a near due date
5. Refresh → **Expected**: the new task appears in the widget
6. Create 6 tasks assigned to yourself
7. **Expected**: only 5 tasks shown in the widget (up to 5 limit)
8. Click "View all tasks" link → **Expected**: navigates to `/tasks`

### Scenario 5 — Recent Activity Feed (DSH-06, SC-004)

1. Log 11 activities in quick succession
2. Refresh the Dashboard → view Recent Activity section
3. **Expected**: exactly 10 activities shown (most recent at top)
4. **Expected**: the oldest of the 11 does NOT appear

### Scenario 6 — Navigate from Dashboard Widgets (US2)

1. Click a task title in the My Tasks widget → **Expected**: navigates to Tasks page
2. Click a contact name in the Recent Activity feed → **Expected**: navigates to that Contact's detail page

### Scenario 7 — Empty State for New Users (DSH-07, SC-005)

1. Create a fresh user with no linked data
2. Log in as that user
3. **Expected**: Pipeline Summary, My Tasks, and Recent Activity all show empty state with call-to-action buttons (not blank white areas)

---

## API Smoke Test

```powershell
$res = Invoke-RestMethod -Uri http://localhost:5000/api/auth/login -Method POST -ContentType "application/json" -Body '{"email":"admin@aicrm.local","password":"Admin1234!"}'
$token = $res.token

# Dashboard summary
Invoke-RestMethod -Uri http://localhost:5000/api/dashboard/summary -Headers @{ Authorization = "Bearer $token" }
# Expected: { metrics: {...}, pipelineSummary: [...], myTasks: [...], recentActivities: [...] }
```

---

## Sign-Off Checklist

- [ ] Dashboard is the first page seen after login (no redirect to another page)
- [ ] All four sections load within 2 seconds on first visit
- [ ] Metric card numbers verified against actual data in each module
- [ ] Pipeline Summary excludes Closed Lost stage
- [ ] My Tasks widget never shows completed tasks
- [ ] My Tasks widget shows max 5 tasks; "View all tasks" link works
- [ ] Recent Activity shows exactly the 10 most recent global activities
- [ ] All empty states show a visible call-to-action (not blank)
- [ ] `dashboard::summary::{userId}` Redis cache expires after 5 minutes (verify TTL with `redis-cli ttl`)
