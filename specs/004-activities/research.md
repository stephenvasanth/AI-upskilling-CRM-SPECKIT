# Research: Activity Logging

**Feature**: `004-activities` | **Date**: 2026-06-16

> Stack decisions established in `001-auth/research.md`. This file documents module-specific decisions.

---

## Decision 1: Author Attribution Strategy

**Decision**: Author is always set server-side from `SecurityContextHolder` — never accepted from the request body

**Rationale**:
- Constitution principle II: no client-controlled security-relevant fields
- `AuthService` in Spring Security already holds the authenticated `UserPrincipal`
  after JWT validation; `activityService.create(request, principal.getId())` sets
  the author inside the service layer
- Prevents any user from logging an activity as another user

---

## Decision 2: Activity Feed Caching

**Decision**: Per-contact feed cached at `activities::contact::{contactId}::page::{page}`;
per-deal feed at `activities::deal::{dealId}::page::{page}`;
global feed at `activities::global::page::{page}`

**Rationale**:
- Three distinct access patterns map to three cache key families
- On `POST /api/activities` (create): evict all keys matching the affected
  contact and/or deal feed, plus the global feed page 1 (`@CacheEvict` with
  `allEntries = true` on the respective cache names)
- On `DELETE /api/activities/{id}`: same eviction pattern
- Spring Cache `@CacheEvict(value = "activities-contact", allEntries = true)`
  is the safest choice — avoids stale contact feed pages after a new log

---

## Decision 3: Date/Time Handling

**Decision**: `activityDate` is an `Instant` stored as `TIMESTAMPTZ`; defaults to server `Instant.now()` if request body omits it; client may provide a backdate

**Rationale**:
- Backdating is explicitly allowed per spec assumption
- `Instant` + PostgreSQL `TIMESTAMPTZ` stores UTC; Angular formats it for display
  using `DatePipe` with the user's local timezone
- Request DTO field: `@JsonFormat(shape = STRING) Instant activityDate` — omitting
  it triggers the service default

---

## Decision 4: Global Feed Pagination and Filtering

**Decision**: Server-side pagination (`Pageable`) + server-side filter via `@Query` with optional `type`, `contactId`, `dateFrom`, `dateTo` parameters

**Rationale**:
- Global feed can grow large; client-side filtering on a full dataset is not viable
- JPA Specifications compose optional filters cleanly:
  ```java
  Specification<Activity> spec = Specification.where(null);
  if (type != null)    spec = spec.and(hasType(type));
  if (contactId != null) spec = spec.and(hasContact(contactId));
  if (dateFrom != null)  spec = spec.and(afterDate(dateFrom));
  ```
- Page size 20 consistent with other lists

---

## Decision 5: Shared ActivityFeedComponent

**Decision**: A shared `ActivityFeedComponent` (`@Input() contactId?: string`, `@Input() dealId?: string`) is placed in `shared/components/` and reused on Contact detail and Deal drawer

**Rationale**:
- Both Contact detail and Deal drawer show the same activity feed UI
- A single component accepts `contactId` or `dealId` as input; it loads the
  appropriate endpoint: `GET /api/activities?contactId=x` or `?dealId=y`
- Avoids duplicating the feed template in two separate modules

---

## Summary

| Area | Decision |
|------|----------|
| Author | Set server-side from `SecurityContextHolder`; never from request body |
| Cache keys | `activities::contact::{id}::page::{n}`, `activities::deal::{id}::page::{n}`, `activities::global::page::{n}` |
| Cache invalidation | `@CacheEvict(allEntries=true)` on affected feed cache name on create/delete |
| Date handling | `TIMESTAMPTZ` + `Instant`; default = server `now()`; backdating allowed |
| Global feed | Server-side filter via JPA Specification + `Pageable`; page size 20 |
| Shared component | `ActivityFeedComponent` in `shared/` used by contact-detail + deal-drawer |
