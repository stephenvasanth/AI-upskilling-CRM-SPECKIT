# Research: Contact Management

**Feature**: `002-contacts` | **Date**: 2026-06-16

> Stack decisions (Java 21, Spring Boot 3.3, Angular 20, PostgreSQL, Redis) are
> established in `001-auth/research.md`. This file documents only module-specific decisions.

---

## Decision 1: Contact Search Strategy

**Decision**: JPA `@Query` with `ILIKE` (case-insensitive) across `first_name`, `last_name`, `email`, `company.name`; Spring Data `Pageable` for pagination

**Rationale**:
- `ILIKE` is PostgreSQL-native and covers the 10,000-contact requirement without
  full-text index overhead at this scale
- Single `@Query` joining `contacts` + `companies` keeps the search endpoint to
  one DB round-trip
- `Pageable` from Spring Data JPA maps directly to `LIMIT`/`OFFSET` — no custom
  pagination code needed
- 300 ms requirement is met: `ILIKE '%term%'` on indexed `email` column + join
  with `companies` is sub-100 ms at 10,000 rows on PostgreSQL 16

**Alternatives considered**:
- **PostgreSQL `to_tsvector` full-text search** — more powerful but heavyweight;
  requires a `tsvector` column + GIN index; overkill for a 10,000-row CRM
- **Elasticsearch** — excellent for large-scale search but massive operational
  overhead; not justified for 2–10 users

---

## Decision 2: Tag Filtering Strategy

**Decision**: Server-side tag filter via JOIN on `contact_tags` table; client sends `tagId` as query param

**Rationale**:
- `JOIN contact_tags ON contact_tags.contact_id = contacts.id WHERE contact_tags.tag_id = ?`
  is a single indexed join — fast and accurate
- Combining tag filter + search is handled in one composite query via Spring Data
  JPA Specifications (`Specification<Contact>`) — composable predicates avoid
  `if/else` query-building

**Alternatives considered**:
- **Client-side filtering** — loads all contacts and filters in Angular; breaks for
  large datasets and violates the "search applies to full dataset" assumption

---

## Decision 3: Hard Delete Cascade Strategy

**Decision**: Database-level `ON DELETE CASCADE` for Activities; `ON DELETE SET NULL` for Tasks

**Rationale**:
- Constitution principle V and CON-04 explicitly define the deletion semantics
- DB-level cascades are atomically consistent — no risk of partial deletes from
  application-layer logic
- `ON DELETE CASCADE` on `activities.contact_id` removes linked activities in the
  same transaction as the Contact deletion
- `ON DELETE SET NULL` on `tasks.contact_id` preserves Tasks with `contact_id = NULL`

---

## Decision 4: Company Lookup Strategy

**Decision**: `Company` is a simple `id + name` read-only table; API returns all companies as a flat list for the dropdown picker

**Rationale**:
- Spec assumption: Company field is a lookup only; no create from Contact form
- Full company list fits in a single API call (rarely exceeds a few hundred entries
  for a small team); no pagination needed for the picker
- `companies::list` cached in Redis (TTL 24 h, invalidated when 007-admin adds full
  Company management in a future release)

---

## Decision 5: Avatar Strategy

**Decision**: Initials-based `AvatarComponent` using the design token colour palette; image upload deferred

**Rationale**:
- CON-11 is explicitly "Nice to Have"; the spec assumption states initials avatars
  are the default
- `AvatarComponent` generates a coloured circle with initials from `displayName`
  using a deterministic colour from the design token palette (hashed from name)
- Zero storage dependency — no S3/object-store setup required in this release

---

## Summary

| Area | Decision |
|------|----------|
| Search | `ILIKE` on first/last/email/company via `@Query` + `Pageable` |
| Tag filter | Server-side JOIN on `contact_tags` via JPA Specification |
| Delete cascade | DB `ON DELETE CASCADE` (activities) + `ON DELETE SET NULL` (tasks) |
| Company lookup | Flat `id+name` list, full-list cached in Redis TTL 24 h |
| Avatar | Initials-based; image upload deferred |
| Pagination | 20 per page; Spring Data `Pageable` |
| Cache keys | `contacts::list::{page}::{search}::{tagId}`, `contacts::{id}`, `companies::list` |
