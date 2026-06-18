# Implementation Plan: Activity Logging

**Branch**: `004-activities` | **Date**: 2026-06-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/004-activities/spec.md`
**Depends on**: `001-auth`, `002-contacts` (Contact entity), `003-deals-pipeline` (Deal entity)

---

## Summary

Implement Activity logging — the interaction history for Contacts and Deals.
Activities are logged via a 400 px right-slide drawer (Log Activity), displayed
as a reverse-chronological feed in both the Contact detail page and the Deal
drawer, and browsable on a standalone global Activities page with type/contact/
date-range filters. Create and Delete are supported; edit is explicitly deferred.
The author is set server-side from the authenticated JWT principal.

---

## Technical Context

**Stack**: Java 21 + Spring Boot 3.3 (`crm-service/`) · Angular 20 (`crm-ui/`)
**New files added to**:
- `crm-service/`: `ActivityController`, `ActivityService`, `ActivityRepository`, `Activity` entity
- `crm-ui/`: `activities/` module + shared `ActivityFeedComponent`
- Flyway: `V7__create_activities_table.sql`

**Key dependencies**:
- `001-auth`: JWT filter, `UserPrincipal` (author set from `SecurityContextHolder`)
- `002-contacts`: Contact entity (nullable FK)
- `003-deals-pipeline`: Deal entity (nullable FK)

**Performance goals**:
- New activity appears in feed within 1 second of save (SC-001)
- Global feed first page within 1 second (SC-002)
- Filter updates within 500 ms (SC-003)

**Constraints**:
- Author is always set server-side — never accepted from request body
- `activityDate` defaults to server `Instant.now()` if not provided
- Both `contactId` and `dealId` are nullable; an activity can exist without either
- Edit is deferred (`ACT-07`); delete available to any authenticated user (`ACT-08`)
- Global feed paginated at 20 per page
- Notes are plain text only

---

## Constitution Check

| Principle | Requirement | Status |
|-----------|-------------|--------|
| I. Spec-Driven | `spec.md` approved; 001–003 complete | ✅ |
| II. Security by Default | All `/api/activities/**` require JWT; author set server-side | ✅ |
| III. API Contract Integrity | Per-contact + per-deal + global feeds cached; invalidated on write | ✅ |
| IV. Design System Fidelity | Activity drawer, feed items match `docs/DESIGN.md` §5 | ✅ |
| V. Data Integrity | Activity deleted when parent Contact hard-deleted (CASCADE); standalone activities unaffected | ✅ |
| VI. Scope Discipline | No edit; no author-restricted delete; plain text notes only | ✅ |
| VII. Roles & Permissions | Both USER and ADMIN can create/delete any Activity | ✅ |

---

## Project Structure — New Files

### crm-service additions
```text
src/main/java/com/aicrm/
└── module/
    └── activity/
        ├── Activity.java
        ├── ActivityType.java        # enum: CALL, EMAIL, MEETING, NOTE
        ├── ActivityRepository.java
        ├── ActivityService.java
        ├── ActivityController.java
        └── dto/
            ├── ActivityDto.java
            ├── CreateActivityRequest.java
            └── ActivityFilterParams.java  # type, contactId, dateFrom, dateTo, page
resources/db/migration/
└── V7__create_activities_table.sql
```

### crm-ui additions
```text
src/app/
├── shared/components/
│   └── activity-feed/                   # reused on contact-detail + deal-drawer
│       ├── activity-feed.component.ts
│       ├── activity-feed.component.html
│       └── activity-feed.component.css
└── modules/activities/
    ├── activities.routes.ts
    ├── activities-global/
    │   ├── activities-global.component.ts   # global page with filters
    │   ├── activities-global.component.html
    │   └── activities-global.component.css
    └── log-activity-drawer/
        ├── log-activity-drawer.component.ts
        ├── log-activity-drawer.component.html
        └── log-activity-drawer.component.css
```

---

## Complexity Tracking

*No constitution violations — section intentionally empty.*
