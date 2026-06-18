# API Contracts: Task Management

**Feature**: `005-tasks` | **Date**: 2026-06-16
**Base URL**: `/api/tasks`
**Auth**: All endpoints require `Authorization: Bearer <token>`

> Error envelope is global — see `001-auth/contracts/auth.md`.

---

### GET /api/tasks

Task list with optional filter, assignee scope, and pagination.

**Query params**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `filter` | string | `ALL` | `ALL`, `MY_TASKS`, `OVERDUE`, `TODAY`, `UPCOMING`, `COMPLETED` |
| `page` | int | 0 | Zero-based page |
| `size` | int | 20 | Page size |

**Response 200**
```json
{
  "content": [
    {
      "id": "uuid",
      "title": "Send proposal to Jane",
      "description": "Include pricing for enterprise tier",
      "dueDate": "2026-06-20",
      "status": "PENDING",
      "assigneeId": "uuid",
      "assigneeName": "CRM Admin",
      "contactId": "uuid",
      "contactName": "Jane Smith",
      "dealId": null,
      "dealTitle": null,
      "createdAt": "2026-06-16T10:00:00Z",
      "updatedAt": "2026-06-16T10:00:00Z"
    }
  ],
  "totalElements": 12,
  "totalPages": 1,
  "page": 0,
  "size": 20
}
```

> Cached at `tasks::filter::{filter}::page::{n}`.
> `MY_TASKS` uses the JWT `sub` as the assignee scope server-side.

---

### POST /api/tasks

Create a new task.

**Request**
```json
{
  "title": "Send proposal to Jane",
  "description": "Include pricing for enterprise tier",
  "dueDate": "2026-06-20",
  "assigneeId": "uuid",
  "contactId": "uuid",
  "dealId": null
}
```

| Field | Required | Rules |
|-------|----------|-------|
| `title` | ✅ | 1–255 chars |
| `dueDate` | ✅ | ISO date `YYYY-MM-DD` |
| `assigneeId` | ✅ | Must exist in `users` |
| `description` | — | Free text |
| `contactId` | — | Must exist; nullable |
| `dealId` | — | Must exist; nullable |

**Response 201** — `TaskDto`

> Evicts `tasks::*` (all filter/page combinations).

---

### GET /api/tasks/{id}

Get a single task.

**Response 200** — `TaskDto`

**Response 404**
```json
{ "error": { "code": "NOT_FOUND", "message": "Task not found" } }
```

---

### PUT /api/tasks/{id}

Update all task fields.

**Request** — same shape as POST

**Response 200** — updated `TaskDto`

> Evicts `tasks::*`.

---

### PATCH /api/tasks/{id}/toggle

Toggle task completion status (optimistic UI pair).

**Request**
```json
{ "status": "COMPLETED" }
```

**Response 200** — updated `TaskDto` with new `status`

> Evicts `tasks::*`.

---

### DELETE /api/tasks/{id}

Delete a task.

**Response 204** — no body

> Evicts `tasks::*`.

---

## Angular Service Contract

```typescript
@Injectable({ providedIn: 'root' })
export class TasksService {
  getTasks(filter: TaskFilter, page?: number): Observable<PageResult<TaskDto>> { ... }
  getTask(id: string): Observable<TaskDto> { ... }
  createTask(body: CreateTaskRequest): Observable<TaskDto> { ... }
  updateTask(id: string, body: UpdateTaskRequest): Observable<TaskDto> { ... }
  toggleTask(id: string, status: 'PENDING' | 'COMPLETED'): Observable<TaskDto> { ... }
  deleteTask(id: string): Observable<void> { ... }
}
```

## Optimistic Toggle Contract (Angular component)

```typescript
// In TasksListComponent
onToggle(task: TaskDto): void {
  const previousStatus = task.status;
  const newStatus = task.status === 'PENDING' ? 'COMPLETED' : 'PENDING';

  // 1. Optimistic update
  this.tasksSignal.update(list =>
    list.map(t => t.id === task.id ? { ...t, status: newStatus } : t)
  );

  // 2. HTTP call
  this.tasksService.toggleTask(task.id, newStatus)
    .pipe(catchError(() => {
      // 3. Revert on error
      this.tasksSignal.update(list =>
        list.map(t => t.id === task.id ? { ...t, status: previousStatus } : t)
      );
      this.toastService.error('Could not update task');
      return EMPTY;
    }))
    .subscribe();
}
```
