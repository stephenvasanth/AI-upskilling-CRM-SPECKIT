# API Contracts: Admin — User & Tag Management

**Feature**: `007-admin` | **Date**: 2026-06-16
**Base URLs**: `/api/admin/users`, `/api/admin/tags`
**Auth**: All endpoints require `Authorization: Bearer <token>` with `ADMIN` role.
Non-admin access returns `403 FORBIDDEN`.

> Error envelope is global — see `001-auth/contracts/auth.md`.

---

## Users

### GET /api/admin/users

List all users.

**Response 200**
```json
[
  {
    "id": "uuid",
    "email": "admin@aicrm.local",
    "displayName": "CRM Admin",
    "role": "ADMIN",
    "status": "ACTIVE",
    "createdAt": "2026-06-16T10:00:00Z"
  }
]
```

> Cached at `users::list` TTL 24 h.

---

### POST /api/admin/users

Create a new user account. Admin sets the initial password.

**Request**
```json
{
  "email": "jane@example.com",
  "displayName": "Jane Smith",
  "initialPassword": "Welcome123!",
  "role": "USER"
}
```

| Field | Required | Rules |
|-------|----------|-------|
| `email` | ✅ | Valid email, unique across system |
| `displayName` | ✅ | 1–100 chars |
| `initialPassword` | ✅ | Min 8 chars |
| `role` | ✅ | `USER` or `ADMIN` |

**Response 201** — `UserAdminDto`

**Response 409 — Duplicate email**
```json
{ "error": { "code": "CONFLICT", "message": "Email address already in use" } }
```

> Evicts `users::list` on success.

---

### PATCH /api/admin/users/{id}/role

Change a user's role.

**Request**
```json
{ "role": "ADMIN" }
```

**Response 200** — updated `UserAdminDto`

**Response 409 — Demoting last admin**
```json
{ "error": { "code": "LAST_ADMIN", "message": "Cannot demote the last Admin account" } }
```

> Evicts `users::list` and `users::{id}`.

---

### PATCH /api/admin/users/{id}/status

Activate or deactivate a user.

**Request**
```json
{ "status": "INACTIVE" }
```

**Response 200** — updated `UserAdminDto`

**Response 400 — Self-deactivation attempt**
```json
{ "error": { "code": "SELF_DEACTIVATION", "message": "You cannot deactivate your own account" } }
```

**Response 409 — Deactivating last admin**
```json
{ "error": { "code": "LAST_ADMIN", "message": "Cannot deactivate the last active Admin account" } }
```

> Evicts `users::list` and `users::{id}`.

---

## Tags

### GET /api/admin/tags

List all tags with contact counts.

**Response 200**
```json
[
  {
    "id": "uuid",
    "name": "VIP",
    "colour": "#3B82F6",
    "contactCount": 7,
    "createdAt": "2026-06-16T10:00:00Z"
  }
]
```

> Cached at `tags::list` TTL 24 h.

---

### POST /api/admin/tags

Create a new tag.

**Request**
```json
{
  "name": "VIP",
  "colour": "#3B82F6"
}
```

| Field | Required | Rules |
|-------|----------|-------|
| `name` | ✅ | 1–100 chars |
| `colour` | ✅ | Hex format `#RRGGBB` |

**Response 201** — `TagDto`

> Evicts `tags::list` on success.

---

### DELETE /api/admin/tags/{id}

Delete a tag. Cascades via DB `ON DELETE CASCADE` — removes the tag from all Contacts.

**Response 204** — no body

**Response 404**
```json
{ "error": { "code": "NOT_FOUND", "message": "Tag not found" } }
```

> Evicts `tags::list` on success. Also evicts `contacts::list::*` because Contact
> summaries include tag chips.

---

## Angular Service Contracts

```typescript
@Injectable({ providedIn: 'root' })
export class UserAdminService {
  getUsers(): Observable<UserAdminDto[]> { ... }
  createUser(body: CreateUserRequest): Observable<UserAdminDto> { ... }
  updateRole(id: string, role: 'USER' | 'ADMIN'): Observable<UserAdminDto> { ... }
  updateStatus(id: string, status: 'ACTIVE' | 'INACTIVE'): Observable<UserAdminDto> { ... }
}

@Injectable({ providedIn: 'root' })
export class TagsService {
  getTags(): Observable<TagDto[]> { ... }
  createTag(body: CreateTagRequest): Observable<TagDto> { ... }
  deleteTag(id: string): Observable<void> { ... }
}
```

## Angular Route Guard Enforcement

```typescript
// crm-ui/src/app/modules/admin/admin.routes.ts
export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    canActivate: [adminGuard],   // redirects USER → /dashboard
    children: [
      { path: 'users', loadComponent: () => import('./users/users.component').then(m => m.UsersComponent) },
      { path: 'tags',  loadComponent: () => import('./tags/tags.component').then(m => m.TagsComponent) },
    ]
  }
];
```
