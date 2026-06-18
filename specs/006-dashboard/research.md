# Research: Dashboard

**Feature**: `006-dashboard` | **Date**: 2026-06-16

> Stack decisions established in `001-auth/research.md`. This file documents module-specific decisions.

---

## Decision 1: Single Aggregate Endpoint vs Multiple Endpoints

**Decision**: Single `GET /api/dashboard/summary` endpoint returns all four widget payloads in one response

**Rationale**:
- The Dashboard needs data from 4 sources; 4 parallel HTTP calls add complexity
  and risk partial-load failures on the Angular side
- A single endpoint means one cache key, one loading state, one error handler
- `DashboardService` runs 4 lightweight queries (all indexed) and wraps them in
  `DashboardSummaryDto` — total DB time < 100 ms at 2–10 users
- Angular component: single `httpClient.get<DashboardSummaryDto>(...)` call; all
  four widgets render from the same resolved signal

**Alternatives considered**:
- **4 separate endpoints** — enables independent refresh per widget; over-engineered
  for this scale; adds 3 extra HTTP connections per page load
- **GraphQL** — would allow field-level selection; wrong tool for this scope

---

## Decision 2: Dashboard Cache TTL

**Decision**: `dashboard::summary::{userId}` cached with 5-minute TTL (not 24 h)

**Rationale**:
- Dashboard aggregates live data (activities, tasks, deals) that change frequently
- 24 h TTL would show stale numbers after a user creates a deal or completes a task
- 5 minutes balances performance (no DB hit on every navigation) with freshness
- Cache key includes `userId` because "My Tasks" and "today's tasks count" are
  user-scoped; each user gets their own cached summary
- `@CacheEvict` on Dashboard cache is triggered by writes in other modules
  (e.g., new Activity → evict `dashboard::summary::*` for all users) — handled
  by the respective service's `@CacheEvict` annotation

---

## Decision 3: Pipeline Summary Chart

**Decision**: CSS-based proportional bar chart rendered by `PipelineSummaryComponent` — no external chart library

**Rationale**:
- Adding a chart library (Chart.js, ECharts, ngx-charts) for a single bar chart
  adds 50–200 KB to the bundle — violates the 500 KB constitution limit
- A CSS grid bar chart using `width: calc(count / total * 100%)` on each stage bar
  meets the visual requirement with zero bundle impact
- `CLOSED_LOST` excluded per DSH-03; the component filters the stage list

---

## Decision 4: My Tasks Query

**Decision**: `SELECT * FROM tasks WHERE assignee_id = :userId AND status = 'PENDING' ORDER BY due_date ASC LIMIT 5`

**Rationale**:
- Direct JPA query via `TaskRepository.findTop5ByAssigneeIdAndStatusOrderByDueDateAsc(userId, PENDING)`
- Spring Data derived query naming generates the correct SQL; no `@Query` annotation needed
- Returns at most 5 rows; fast even without a dedicated composite index (`assignee_id + due_date`)
  at 2–10 user scale

---

## Decision 5: Recent Activity Query

**Decision**: `SELECT * FROM activities ORDER BY created_at DESC LIMIT 10` — no filter

**Rationale**:
- Global, most-recent 10 activities across all users
- `createdAt` is indexed (created by Flyway migration); the query is a simple top-N
- `ActivityRepository.findTop10ByOrderByCreatedAtDesc()` — Spring Data derived query

---

## Summary

| Area | Decision |
|------|----------|
| Endpoint design | Single `/api/dashboard/summary` aggregate endpoint |
| Cache TTL | 5 minutes for dashboard (not 24 h); keyed by `userId` |
| Pipeline chart | CSS proportional bars; no chart library |
| My Tasks query | `findTop5ByAssigneeIdAndStatusOrderByDueDateAsc` |
| Recent Activity query | `findTop10ByOrderByCreatedAtDesc` |
| Cache key | `dashboard::summary::{userId}` |
