# Implementation Plan: Admin — User & Tag Management

**Branch**: `007-admin` | **Date**: 2026-06-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/007-admin/spec.md`
**Depends on**: `001-auth` (User entity + JWT), `002-contacts` (ContactTag join, Tag entity)

---

## Summary

Implement the Admin-only management surfaces: Users and Tags. The Users page lists
all team members and allows an Admin to create new accounts, change roles, and
deactivate accounts (with a guard preventing self-deactivation and preventing
demotion of the last Admin). The Tags page lists all tags with contact-count and
allows an Admin to create (via drawer) and delete tags (cascade removes from all
Contacts). Both pages are protected by `adminGuard` on the Angular side and
`@PreAuthorize("hasRole('ADMIN')")` on every backend endpoint. `Tag` and
`ContactTag` entities are scaffolded in `002-contacts` Flyway migrations but their
full CRUD service logic lives here.

---

## Technical Context

**Stack**: Java 21 + Spring Boot 3.3 (`crm-service/`) · Angular 20 (`crm-ui/`)
**New files added to**:
- `crm-service/`: `UserAdminController`, `UserAdminService`, `TagController`, `TagService`
- `crm-ui/`: `admin/` module (users page, tags page, create-user drawer, tag drawer)

**Key dependencies**:
- `001-auth`: `User` entity, `UserRepository`, `BCryptPasswordEncoder`, Redis invalidation
- `002-contacts`: `Tag` entity, `TagRepository`, `ContactTag` join table (FK to contacts)

**Performance goals**:
- Users list and Tags list load within 1 second
- New user can log in within 30 seconds of Admin saving (SC-001)
- Deactivated user login rejected immediately after status change (SC-002)
- Tag deletion propagates to all Contacts within 1 second (SC-003)

**Constraints**:
- Admin MUST NOT be able to deactivate or demote themselves
- Last ADMIN in system cannot be deactivated or demoted (lock-out prevention)
- Tag names do not need to be unique (same name, different colour is valid)
- No email-based invitation; Admin sets initial password directly
- No audit log of Admin actions in this release
- USER-role users see no Admin nav items; `adminGuard` redirects to `/dashboard`

---

## Constitution Check

| Principle | Requirement | Status |
|-----------|-------------|--------|
| I. Spec-Driven | `spec.md` approved; 001 + 002 complete | ✅ |
| II. Security by Default | All `/api/admin/**` endpoints require ADMIN role; `@PreAuthorize` enforced | ✅ |
| III. API Contract Integrity | `users::list`, `tags::list` cache invalidated on every write | ✅ |
| IV. Design System Fidelity | Users table, Tags table, drawers match `docs/DESIGN.md` §5 | ✅ |
| V. Data Integrity | Tag delete cascades via `ON DELETE CASCADE` on `contact_tags`; user deactivation is status update (no data loss) | ✅ |
| VI. Scope Discipline | No audit log; no email invite; no reassignment of owned records on deactivation | ✅ |
| VII. Roles & Permissions | Entire admin module behind `hasRole('ADMIN')`; enforced server-side | ✅ |

---

## Project Structure — New Files

### crm-service additions
```text
src/main/java/com/aicrm/
└── module/
    ├── admin/
    │   ├── UserAdminController.java    # /api/admin/users/**  (ADMIN only)
    │   ├── UserAdminService.java
    │   └── dto/
    │       ├── CreateUserRequest.java
    │       ├── UpdateUserRoleRequest.java
    │       └── UpdateUserStatusRequest.java
    └── tag/
        ├── Tag.java                    # entity (defined here, referenced in 002)
        ├── TagRepository.java
        ├── TagService.java
        ├── TagController.java          # /api/admin/tags/**  (ADMIN only)
        └── dto/
            ├── TagDto.java
            └── CreateTagRequest.java
```

### crm-ui additions
```text
src/app/modules/admin/
├── admin.routes.ts                    # canActivate: [adminGuard]
├── users/
│   ├── users.component.ts             # users table
│   ├── users.component.html
│   └── users.component.css
├── create-user-drawer/
│   ├── create-user-drawer.component.ts
│   ├── create-user-drawer.component.html
│   └── create-user-drawer.component.css
├── tags/
│   ├── tags.component.ts              # tags table with contact count
│   ├── tags.component.html
│   └── tags.component.css
└── create-tag-drawer/
    ├── create-tag-drawer.component.ts
    ├── create-tag-drawer.component.html
    └── create-tag-drawer.component.css
```

---

## Complexity Tracking

| Item | Complexity driver | Mitigation |
|------|-------------------|------------|
| Last-admin guard | Preventing all admins from being removed requires a count check | `UserAdminService`: before deactivate/demote, `COUNT(*) WHERE role=ADMIN > 1` else throw 409 |
| Self-deactivation | Admin must not deactivate themselves | Compare request `userId` with `UserPrincipal.getId()` in service; throw 400 if equal |
