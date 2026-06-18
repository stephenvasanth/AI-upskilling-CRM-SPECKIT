# Data Model: Dashboard

**Feature**: `006-dashboard` | **Date**: 2026-06-16

> No new entities or migrations. The Dashboard is a read-only aggregation of data
> from modules 001–005.

---

## Data Sources

| Widget | Source tables | Query |
|--------|--------------|-------|
| Open deal count + pipeline value | `deals` | `WHERE stage NOT IN ('CLOSED_WON','CLOSED_LOST')` — COUNT + SUM(value) |
| Today's tasks count (current user) | `tasks` | `WHERE assignee_id = :userId AND due_date = CURRENT_DATE AND status = 'PENDING'` |
| Contacts added last 7 days | `contacts` | `WHERE created_at >= now() - INTERVAL '7 days'` — COUNT |
| Pipeline Summary | `deals` | `GROUP BY stage` — COUNT + SUM(value), exclude CLOSED_LOST |
| My Tasks widget (up to 5) | `tasks` | `WHERE assignee_id = :userId AND status = 'PENDING' ORDER BY due_date ASC LIMIT 5` |
| Recent Activity feed (10) | `activities` | `ORDER BY created_at DESC LIMIT 10` (all users) |

---

## DTOs

```java
// Root payload — single HTTP response
public record DashboardSummaryDto(
    MetricsDto            metrics,
    List<StageCountDto>   pipelineSummary,
    List<TaskDto>         myTasks,
    List<ActivityDto>     recentActivities
) {}

public record MetricsDto(
    long       openDealCount,
    BigDecimal totalPipelineValue,
    long       todayTaskCount,     // current user's tasks due today
    long       newContactCount     // contacts added in last 7 days
) {}

public record StageCountDto(
    String     stage,
    long       count,
    BigDecimal totalValue
) {}
```

---

## Redis Cache Key

| Key | Value | TTL | Invalidated on |
|-----|-------|-----|----------------|
| `dashboard::summary::{userId}` | `DashboardSummaryDto` | **5 minutes** | On writes to deals, tasks, contacts, or activities (via `@CacheEvict` in respective services) |

> TTL is 5 minutes (not 24 h) because the dashboard aggregates live data that
> changes with every new activity, deal, or task (see `006-dashboard/research.md`).

---

## Spring Data Queries in DashboardService

All queries are native JPQL or derived-name queries in existing repositories.
`DashboardService` injects `DealRepository`, `TaskRepository`,
`ContactRepository`, and `ActivityRepository` — no new repositories needed.

```java
// In TaskRepository:
List<Task> findTop5ByAssigneeIdAndStatusOrderByDueDateAsc(String assigneeId, TaskStatus status);

// In ActivityRepository:
List<Activity> findTop10ByOrderByCreatedAtDesc();

// In DealRepository (native query):
@Query("SELECT d.stage, COUNT(d), SUM(d.value) FROM Deal d WHERE d.stage != 'CLOSED_LOST' GROUP BY d.stage")
List<Object[]> getPipelineSummary();

@Query("SELECT COUNT(d) FROM Deal d WHERE d.stage NOT IN ('CLOSED_WON','CLOSED_LOST')")
long countOpenDeals();

@Query("SELECT COALESCE(SUM(d.value),0) FROM Deal d WHERE d.stage NOT IN ('CLOSED_WON','CLOSED_LOST')")
BigDecimal sumOpenDealValue();
```
