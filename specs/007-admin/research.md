# Research: Admin — User & Tag Management

**Feature**: `007-admin` | **Date**: 2026-06-16

> Stack decisions established in `001-auth/research.md`. This file documents module-specific decisions.

---

## Decision 1: Admin Endpoint Security Pattern

**Decision**: `@PreAuthorize("hasRole('ADMIN')")` on every method in `UserAdminController` and `TagController`; `adminGuard` (`CanActivateFn`) on all `/admin/**` Angular routes

**Rationale**:
- Server-side enforcement is authoritative (constitution principle VII); client-side
  guard is supplementary (prevents unnecessary navigation, not a security boundary)
- `@PreAuthorize` at the method level is more granular than a `SecurityConfig` path
  matcher — easier to read and audit in code review
- Angular `adminGuard` checks `authService.isAdmin()` signal; redirects USER-role
  users to `/dashboard`; admin nav items are hidden in `SidebarComponent`

---

## Decision 2: Last-Admin Lock-Out Prevention

**Decision**: Before any deactivation or role-demotion, `UserAdminService` counts `SELECT COUNT(*) FROM users WHERE role = 'ADMIN' AND status = 'ACTIVE'`; if count = 1 and target is that admin, throw a `409 CONFLICT` with code `LAST_ADMIN`

**Rationale**:
- Self-deactivation is also prevented: `UserAdminService` compares target `userId`
  with `principal.getId()`; throws `400 BAD_REQUEST` with code `SELF_DEACTIVATION`
- These are two separate checks — both run before any update is applied
- No DB constraint can enforce the last-admin rule; application logic is required

---

## Decision 3: Tag Deletion Cascade

**Decision**: DB-level `ON DELETE CASCADE` on `contact_tags.tag_id → tags.id`; no application-layer cascade logic needed

**Rationale**:
- Atomic, consistent — the `contact_tags` rows are deleted in the same DB transaction
  as the `tags` row
- Service calls `tagRepository.deleteById(id)` → Flyway FK constraint handles
  the join table cleanup automatically
- After delete, `tags::list` Redis cache is evicted so the next Tag page load
  reflects the removal

---

## Decision 4: Initial Password Policy

**Decision**: Admin sets initial password (min 8 chars, validated); stored as BCrypt hash; new user changes it on first login via Profile page

**Rationale**:
- No email-based invitation flow per spec assumption; Admin shares credentials directly
- Same BCrypt + min-8-chars rule as all passwords (constitution principle II)
- `CreateUserRequest.initialPassword` is validated with `@NotBlank @Size(min=8)`;
  hashed via `BCryptPasswordEncoder` before persistence
- No "force change on first login" flag in this release

---

## Decision 5: Tag Colour Representation

**Decision**: Colour stored as a CSS hex string (`VARCHAR(7)`, e.g., `#3B82F6`); a preset palette of 10 colours is offered in the Create Tag drawer; free hex input is also accepted

**Rationale**:
- Hex is the most universal colour format for CSS; works directly in `[style.background]`
  Angular binding without conversion
- Preset palette reduces design variation while allowing flexibility
- Backend validates hex format with `@Pattern(regexp = "^#[0-9A-Fa-f]{6}$")`

---

## Summary

| Area | Decision |
|------|----------|
| Admin endpoint guard | `@PreAuthorize("hasRole('ADMIN')")` on all admin methods |
| Angular route guard | `adminGuard` (`CanActivateFn`) on `/admin/**`; sidebar hides items for USER |
| Last-admin protection | Count check in `UserAdminService` before deactivate/demote |
| Self-deactivation | Compare target userId to JWT `sub` before update |
| Tag cascade | DB `ON DELETE CASCADE` on `contact_tags.tag_id` |
| Tag colour | `VARCHAR(7)` hex string; preset palette + free input; `@Pattern` validation |
| Cache invalidation | `users::list` evicted on any user write; `tags::list` evicted on any tag write |
