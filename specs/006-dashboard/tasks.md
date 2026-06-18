# Tasks: Dashboard

**Input**: Design documents from `specs/006-dashboard/`

**Prerequisites**: spec.md ✅ · plan.md ✅ · research.md ✅ · quickstart.md ✅

**Depends on**: ALL prior modules complete (001–005) — Dashboard is a read-only aggregate of all entities.

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

---

## Phase 1: Setup

**Purpose**: Angular module skeleton for dashboard. No new Flyway migration (no new entities).

- [X] T001 Create Angular `dashboard.routes.ts` and register `/dashboard` as the default redirect after login in `crm-ui/src/app/app.routes.ts` (lazy-loaded, protected by `authGuard`)
- [X] T002 [P] Create Angular `DashboardService` (`getSummary(): Observable<DashboardSummaryDto>`) in `crm-ui/src/app/modules/dashboard/dashboard.service.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Backend aggregate endpoint and DTOs.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T003 Create `MetricsDto.java`, `PipelineSummaryDto.java`, `StageCountDto.java`, `MyTasksDto.java`, `RecentActivityDto.java`, `DashboardSummaryDto.java` records in `crm-service/src/main/java/com/aicrm/module/dashboard/dto/`
- [X] T004 Create `DashboardService.java` (aggregate queries: open deal count + pipeline value, today's tasks for current user, contacts added last 7 days, deal counts per active stage, 5 upcoming/overdue tasks for current user, 10 most recent global activities; cache at `dashboard::summary::{userId}` TTL 5 min) in `crm-service/src/main/java/com/aicrm/module/dashboard/`
- [X] T005 Create `DashboardController.java` (`GET /api/dashboard/summary` — requires JWT; `userId` from `UserPrincipal`) in `crm-service/src/main/java/com/aicrm/module/dashboard/`

**Checkpoint**: `GET /api/dashboard/summary` returns all four widget payloads in one response. Cached with 5-min TTL.

---

## Phase 3: User Story 1 — See a Personal Snapshot on Login (Priority: P1) 🎯 MVP

**Goal**: After login the Dashboard loads as the first page, showing all four sections within 2 seconds. Metric cards, pipeline chart, My Tasks widget, and Recent Activity feed all display correct data. Empty sections show actionable empty states.

**Independent Test**: Log in → verify Dashboard is first page → verify 3 metric cards present → verify Pipeline Summary chart shows Lead–Closed Won stages → verify My Tasks widget shows ≤5 incomplete tasks → verify Recent Activity feed shows ≤10 most recent activities.

### Implementation for User Story 1

- [X] T006 [P] [US1] Create `MetricCardComponent` (displays label + value; `EmptyStateComponent` when value is zero or null) in `crm-ui/src/app/modules/dashboard/metric-card/`
- [X] T007 [P] [US1] Create `PipelineSummaryComponent` (CSS-based horizontal bar chart showing deal count per active stage — Lead/Qualified/Proposal/Negotiation/Closed Won; excludes Closed Lost per DSH-03; empty state when no deals) in `crm-ui/src/app/modules/dashboard/pipeline-summary/`
- [X] T008 [P] [US1] Create `MyTasksWidgetComponent` (up to 5 PENDING tasks for current user, sorted by dueDate ASC; due date colour-coding: red=overdue, orange=today, grey=future; "View all tasks" link to `/tasks`; empty state) in `crm-ui/src/app/modules/dashboard/my-tasks-widget/`
- [X] T009 [P] [US1] Create `RecentActivityWidgetComponent` (10 most recent global activities: type icon, subject, linked contact/deal chip, author, timestamp; empty state) in `crm-ui/src/app/modules/dashboard/recent-activity-widget/`
- [X] T010 [US1] Create `DashboardComponent` (page shell: calls `DashboardService.getSummary()` on init; renders all 4 widget components with their data slices; skeleton loader while loading) in `crm-ui/src/app/modules/dashboard/dashboard/`
- [X] T011 [US1] Update `AuthService` redirect after successful login (`001-auth`) to navigate to `/dashboard`
- [X] T012 [US1] Verify `SidebarComponent` (`001-auth`) has "Dashboard" as first nav item, linked to `/dashboard`

**Checkpoint**: Dashboard loads within 2 seconds after login. All 4 sections display correct data. Empty states appear for sections with no data. Metric numbers match module list counts.

---

## Phase 4: User Story 2 — Navigate to Details from the Dashboard (Priority: P2)

**Goal**: Clicking a task in My Tasks widget navigates to Tasks list. Clicking a contact name in Recent Activity navigates to that Contact's detail page. "View all tasks" link works.

**Independent Test**: Click task in My Tasks widget → navigates to `/tasks` with task visible. Click contact name in Recent Activity → navigates to contact detail. Click "View all tasks" → navigates to `/tasks`.

### Implementation for User Story 2

- [X] T013 [US2] Add `routerLink` to task rows in `MyTasksWidgetComponent` (T008) pointing to `/tasks` (task list, where the task will be visible in the "All" filter)
- [X] T014 [US2] Add contact name as `routerLink` in `RecentActivityWidgetComponent` (T009) pointing to `/contacts/{contactId}` (only when `contactId` is not null)
- [X] T015 [US2] Verify "View all tasks" link in `MyTasksWidgetComponent` (T008) navigates to `/tasks`

**Checkpoint**: All navigation links from dashboard work correctly. No broken links when contact or deal is null.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [X] T016 [P] Write `DashboardServiceTest.java` (Mockito: aggregate query logic for each metric, My Tasks scope to current user, Recent Activity limit 10) in `crm-service/src/test/java/com/aicrm/dashboard/`
- [X] T017 [P] Write `DashboardControllerTest.java` (@SpringBootTest slice — GET /api/dashboard/summary with auth) in `crm-service/src/test/java/com/aicrm/dashboard/`
- [X] T018 Run quickstart.md validation scenarios end-to-end (verify metric accuracy by cross-referencing module lists)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Depends on `001-auth` complete (app.routes.ts exists)
- **Phase 2 (Foundational)**: Depends on Phase 1; requires all 001–005 tables populated for meaningful data
- **Phase 3 (US1 Snapshot)**: Depends on Phase 2
- **Phase 4 (US2 Navigation)**: Depends on Phase 3 (widget components must exist)
- **Phase 5 (Polish)**: Depends on Phases 3–4

### Parallel Opportunities

- T001 + T002: Routes + service simultaneously
- T003 + T004 + T005: DTOs and backend can be written in parallel (T005 depends on T004)
- T006 + T007 + T008 + T009: All 4 widget components can be built in parallel
- T013 + T014 + T015: All navigation links can be wired in parallel
- T016 + T017: Both test classes simultaneously

---

## Parallel Example: User Story 1

```bash
# Parallel group — all 4 widget components use DashboardSummaryDto fields independently:
Task T006: MetricCardComponent
Task T007: PipelineSummaryComponent
Task T008: MyTasksWidgetComponent
Task T009: RecentActivityWidgetComponent

# Sequential: shell component assembles the widgets:
Task T010: DashboardComponent (depends on T006-T009)
```

---

## Implementation Strategy

### MVP First (US1 Snapshot)

1. Complete Phase 1: Setup (routes, service)
2. Complete Phase 2: Foundational (backend aggregate endpoint)
3. Complete all of Phase 3: US1 (all 4 widget components + shell)
4. **STOP and VALIDATE**: Dashboard loads → all 4 sections visible → data accurate → empty states work
5. Complete Phase 4: US2 (navigation links)

---

## Notes

- `[P]` tasks have no file conflicts — safe to run concurrently
- No new Flyway migrations — Dashboard reads from existing tables via aggregate JPQL queries on existing repositories
- Dashboard cache TTL is 5 minutes (NOT 24h) — aggregate data changes frequently per plan.md complexity tracking
- Cache key is `dashboard::summary::{userId}` — scoped per user because "My Tasks" and "tasks due today" are user-specific
- Pipeline Summary excludes `CLOSED_LOST` (DSH-03) — filter in the JPQL query with `stage NOT IN ('CLOSED_WON', 'CLOSED_LOST')` for the chart, but include all for the "open deals" metric card
- "Open deals" metric = all stages except `CLOSED_WON` AND `CLOSED_LOST`
- Metric cards are read-only (no navigation on click) in this release — per scope discipline (DSH-08, plan.md)
- Pipeline bar chart is CSS-based — no external charting library (keeps bundle under 500 KB)
