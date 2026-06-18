# API Contracts: Activity Logging

**Feature**: `004-activities` | **Date**: 2026-06-16
**Base URL**: `/api/activities`
**Auth**: All endpoints require `Authorization: Bearer <token>`

> Error envelope is global — see `001-auth/contracts/auth.md`.

---

### POST /api/activities

Log a new activity. Author is set server-side from the JWT — not accepted from the request body.

**Request**
```json
{
  "type": "CALL",
  "subject": "Discovery call with Jane",
  "notes": "Discussed pain points. Follow-up scheduled for next week.",
  "activityDate": "2026-06-16T14:30:00Z",
  "contactId": "uuid",
  "dealId": null
}
```

| Field | Required | Rules |
|-------|----------|-------|
| `type` | ✅ | `CALL`, `EMAIL`, `MEETING`, or `NOTE` |
| `subject` | ✅ | 1–255 chars |
| `notes` | — | Plain text; no length limit |
| `activityDate` | — | ISO-8601 instant; defaults to server `now()` if omitted |
| `contactId` | — | Must exist; nullable |
| `dealId` | — | Must exist; nullable |

**Response 201** — `ActivityDto`
```json
{
  "id": "uuid",
  "type": "CALL",
  "subject": "Discovery call with Jane",
  "notes": "Discussed pain points.",
  "activityDate": "2026-06-16T14:30:00Z",
  "authorId": "uuid",
  "authorName": "CRM Admin",
  "contactId": "uuid",
  "contactName": "Jane Smith",
  "dealId": null,
  "dealTitle": null,
  "createdAt": "2026-06-16T14:31:00Z"
}
```

> On success, evicts `activities::contact::{contactId}::*` and/or `activities::deal::{dealId}::*`
> and `activities::global::*`.

---

### GET /api/activities

Global activity feed — all activities, paginated, with optional filters.

**Query params**

| Param | Type | Description |
|-------|------|-------------|
| `page` | int | Zero-based page (default 0) |
| `size` | int | Page size (default 20) |
| `type` | string | Filter by `CALL`, `EMAIL`, `MEETING`, or `NOTE` |
| `contactId` | string | Filter by linked contact |
| `dateFrom` | ISO instant | Activities on or after this date |
| `dateTo` | ISO instant | Activities on or before this date |

**Response 200**
```json
{
  "content": [ /* ActivityDto[] */ ],
  "totalElements": 150,
  "totalPages": 8,
  "page": 0,
  "size": 20
}
```

> Cached at `activities::global::page::{n}`. Filters are not cached individually —
> filtered requests bypass cache (only the unfiltered first page is cached).

---

### GET /api/activities?contactId={id}

Per-contact activity feed (reverse-chronological, paginated).

> Same endpoint as global feed; `contactId` param scopes the query.
> Cached at `activities::contact::{id}::page::{n}`.

---

### GET /api/activities?dealId={id}

Per-deal activity feed.

> Cached at `activities::deal::{id}::page::{n}`.

---

### DELETE /api/activities/{id}

Delete an activity. Any authenticated user may delete any activity (author restriction deferred).

**Response 204** — no body

> Evicts all activity cache keys for the affected contact, deal, and global feed.

**Response 404**
```json
{ "error": { "code": "NOT_FOUND", "message": "Activity not found" } }
```

---

## Angular Service Contract

```typescript
@Injectable({ providedIn: 'root' })
export class ActivitiesService {
  getActivities(params: ActivityFilterParams): Observable<PageResult<ActivityDto>> { ... }
  logActivity(body: CreateActivityRequest): Observable<ActivityDto> { ... }
  deleteActivity(id: string): Observable<void> { ... }
}
```

## Shared ActivityFeedComponent Input Contract

```typescript
// Used on Contact detail page and Deal drawer
@Component({ selector: 'app-activity-feed', standalone: true })
export class ActivityFeedComponent {
  @Input() contactId?: string;
  @Input() dealId?: string;
  // Loads GET /api/activities?contactId=x OR ?dealId=y depending on which input is set
}
```
