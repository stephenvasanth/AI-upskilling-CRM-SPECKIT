# API Contracts: Dashboard

**Feature**: `006-dashboard` | **Date**: 2026-06-16
**Base URL**: `/api/dashboard`
**Auth**: All endpoints require `Authorization: Bearer <token>`

> Error envelope is global — see `001-auth/contracts/auth.md`.

---

### GET /api/dashboard/summary

Returns all four dashboard widget payloads in a single response. The `myTasks`
section and `todayTaskCount` metric are scoped to the authenticated user (JWT `sub`).

**Response 200**
```json
{
  "metrics": {
    "openDealCount": 12,
    "totalPipelineValue": 145000.00,
    "todayTaskCount": 3,
    "newContactCount": 5
  },
  "pipelineSummary": [
    { "stage": "LEAD",        "count": 4, "totalValue": 40000.00 },
    { "stage": "QUALIFIED",   "count": 3, "totalValue": 35000.00 },
    { "stage": "PROPOSAL",    "count": 2, "totalValue": 30000.00 },
    { "stage": "NEGOTIATION", "count": 2, "totalValue": 25000.00 },
    { "stage": "CLOSED_WON",  "count": 1, "totalValue": 15000.00 }
  ],
  "myTasks": [
    {
      "id": "uuid",
      "title": "Send proposal to Jane",
      "dueDate": "2026-06-17",
      "status": "PENDING",
      "contactName": "Jane Smith"
    }
  ],
  "recentActivities": [
    {
      "id": "uuid",
      "type": "CALL",
      "subject": "Discovery call with Jane",
      "contactName": "Jane Smith",
      "authorName": "CRM Admin",
      "activityDate": "2026-06-16T14:30:00Z"
    }
  ]
}
```

**Notes**:
- `pipelineSummary` excludes `CLOSED_LOST` stage (DSH-03)
- `openDealCount` counts deals in any stage except `CLOSED_WON` and `CLOSED_LOST`
- `todayTaskCount` = current user's `PENDING` tasks where `dueDate = CURRENT_DATE`
- `newContactCount` = contacts created in rolling last 7 days
- `myTasks` = up to 5, sorted by `dueDate ASC`
- `recentActivities` = last 10 globally, sorted by `activityDate DESC`

> Cached at `dashboard::summary::{userId}` with **5-minute TTL**.
> Evicted by writes in other modules (deals, tasks, contacts, activities services).

**Response 401**
```json
{ "error": { "code": "UNAUTHORIZED", "message": "Authentication required" } }
```

---

## Angular Service Contract

```typescript
@Injectable({ providedIn: 'root' })
export class DashboardService {
  getSummary(): Observable<DashboardSummaryDto> { ... }
}
```

## Angular Dashboard Component Contract

```typescript
@Component({ selector: 'app-dashboard', standalone: true })
export class DashboardComponent implements OnInit {
  readonly summary = signal<DashboardSummaryDto | null>(null);
  readonly isLoading = signal(true);

  ngOnInit(): void {
    this.dashboardService.getSummary()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe(data => this.summary.set(data));
  }
}
```

## Empty State Behaviour

Each widget section shows an empty state when its data array is empty or count is zero:

| Section | Empty state message | CTA |
|---------|--------------------|----|
| Metric cards | `0` value displayed; no empty state UI | — |
| Pipeline Summary | "No active deals yet" | "Create your first deal →" (links to `/deals`) |
| My Tasks | "No tasks due" | "View all tasks →" (links to `/tasks`) |
| Recent Activity | "No activity logged yet" | "Log an activity →" (links to `/activities`) |
