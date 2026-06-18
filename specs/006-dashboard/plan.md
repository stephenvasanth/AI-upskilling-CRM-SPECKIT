# Implementation Plan: Dashboard

**Branch**: `006-dashboard` | **Date**: 2026-06-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/006-dashboard/spec.md`
**Depends on**: All prior modules (001–005) — Dashboard is a read-only aggregate

---

## Summary

Implement the Dashboard — the default landing page after login. It aggregates
data from Contacts, Deals, Activities, and Tasks via a single dedicated backend
endpoint (`GET /api/dashboard/summary`) that returns all four widgets in one
response. The Angular component renders: three metric cards (open deals + pipeline
value, today's tasks for current user, contacts added last 7 days), a Pipeline
Summary bar chart (deal count per active stage), a My Tasks widget (up to 5
incomplete tasks for current user), and a Recent Activity feed (10 most recent
global activities). No new entities are introduced; this module is purely
aggregation and presentation.

---

## Technical Context

**Stack**: Java 21 + Spring Boot 3.3 (`crm-service/`) · Angular 20 (`crm-ui/`)
**New files added to**:
- `crm-service/`: `DashboardController`, `DashboardService` (aggregate queries)
- `crm-ui/`: `dashboard/` module (4 widget components)

**Key dependencies**:
- All repositories: `ContactRepository`, `DealRepository`, `ActivityRepository`, `TaskRepository`
- `001-auth`: JWT filter, `UserPrincipal` (for "My Tasks" and "today's tasks" filter)
- Modules 002–005 complete and their tables populated

**Performance goals**:
- All four sections visible within 2 seconds (SC-001)
- Single HTTP call returns entire dashboard payload

**Constraints**:
- Dashboard data is fetched fresh on page load only (no auto-refresh)
- Pipeline Summary excludes `CLOSED_LOST` deals (DSH-03)
- "Open deals" = any stage except `CLOSED_WON` and `CLOSED_LOST`
- My Tasks = current user's `PENDING` tasks, sorted by `dueDate ASC`, limit 5
- Recent Activity = all users, sorted by `createdAt DESC`, limit 10
- "Contacts added this week" = rolling 7-day window (`createdAt >= now() - 7 days`)
- Metric cards are read-only (no navigation on click in this release)

---

## Constitution Check

| Principle | Requirement | Status |
|-----------|-------------|--------|
| I. Spec-Driven | `spec.md` approved; all 001–005 must be complete | ✅ |
| II. Security by Default | `GET /api/dashboard/summary` requires JWT; My Tasks scoped to `sub` from JWT | ✅ |
| III. API Contract Integrity | Dashboard summary cached with short TTL (5 min) — data is aggregate, staleness acceptable | ✅ |
| IV. Design System Fidelity | Metric cards, pipeline bar, task widget, activity feed match `docs/DESIGN.md` §5 | ✅ |
| V. Data Integrity | Read-only; no mutations | ✅ |
| VI. Scope Discipline | No auto-refresh; no clickable metric cards; no new entities | ✅ |
| VII. Roles & Permissions | Dashboard visible to both USER and ADMIN; My Tasks scoped to current user | ✅ |

---

## Project Structure — New Files

### crm-service additions
```text
src/main/java/com/aicrm/
└── module/
    └── dashboard/
        ├── DashboardController.java
        ├── DashboardService.java
        └── dto/
            ├── DashboardSummaryDto.java  # wraps all four widget DTOs
            ├── MetricsDto.java           # openDeals, pipelineValue, todayTasks, newContacts
            ├── PipelineSummaryDto.java   # List<StageCountDto>
            ├── StageCountDto.java        # stage, count, totalValue
            ├── MyTasksDto.java           # List<TaskDto> (up to 5)
            └── RecentActivityDto.java    # List<ActivityDto> (up to 10)
```

### crm-ui additions
```text
src/app/modules/dashboard/
├── dashboard.routes.ts
├── dashboard/
│   ├── dashboard.component.ts        # page shell, loads summary
│   ├── dashboard.component.html
│   └── dashboard.component.css
├── metric-card/
│   ├── metric-card.component.ts
│   ├── metric-card.component.html
│   └── metric-card.component.css
├── pipeline-summary/
│   ├── pipeline-summary.component.ts  # bar chart (CSS-based, no chart library)
│   ├── pipeline-summary.component.html
│   └── pipeline-summary.component.css
├── my-tasks-widget/
│   ├── my-tasks-widget.component.ts
│   ├── my-tasks-widget.component.html
│   └── my-tasks-widget.component.css
└── recent-activity-widget/
    ├── recent-activity-widget.component.ts
    ├── recent-activity-widget.component.html
    └── recent-activity-widget.component.css
```

---

## Complexity Tracking

| Item | Complexity driver | Mitigation |
|------|-------------------|------------|
| Dashboard cache TTL | Aggregate data changes frequently; 24 h TTL too long | Use 5-min TTL for `dashboard::summary::{userId}` — short but avoids DB hit on every navigation |
