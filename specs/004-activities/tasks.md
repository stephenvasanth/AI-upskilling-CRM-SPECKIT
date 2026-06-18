# Tasks: Activity Logging

**Input**: Design documents from `specs/004-activities/`

**Prerequisites**: spec.md ✅ · plan.md ✅ · data-model.md ✅ · research.md ✅ · quickstart.md ✅

**Depends on**: `001-auth` · `002-contacts` (Contact entity) · `003-deals-pipeline` (Deal entity)

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

---

## Phase 1: Setup

**Purpose**: Flyway migration for the activities table.

- [X] T001 Create `V7__create_activities_table.sql` Flyway migration in `crm-service/src/main/resources/db/migration/` (idempotent; `contact_id ON DELETE CASCADE`, `deal_id ON DELETE SET NULL`, `author_id ON DELETE SET NULL`; indexes on contact_id/deal_id/created_at)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core entity, repository, DTOs, and Angular module skeleton.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T002 Create `ActivityType.java` enum (`CALL, EMAIL, MEETING, NOTE`) in `crm-service/src/main/java/com/aicrm/module/activity/`
- [X] T003 Create `Activity.java` JPA entity (author ManyToOne User NOT NULL, contact ManyToOne nullable, deal ManyToOne nullable, activityDate defaults to `Instant.now()`) in `crm-service/src/main/java/com/aicrm/module/activity/`
- [X] T004 Create `ActivityRepository.java` (JpaRepository with `findByContactIdOrderByActivityDateDesc`, `findByDealIdOrderByActivityDateDesc`, `findAllWithFilters` paginated JPQL) in `crm-service/src/main/java/com/aicrm/module/activity/`
- [X] T005 [P] Create `ActivityDto.java`, `CreateActivityRequest.java`, `ActivityFilterParams.java` in `crm-service/src/main/java/com/aicrm/module/activity/dto/`
- [X] T006 Create Angular `activities.routes.ts` and register in `crm-ui/src/app/app.routes.ts` (lazy-loaded)
- [X] T007 [P] Create Angular `ActivitiesService` (getActivitiesByContact, getActivitiesByDeal, getGlobalActivities, createActivity, deleteActivity) in `crm-ui/src/app/modules/activities/activities.service.ts`

**Checkpoint**: Activity entity compiles; migration runs; Angular module loads.

---

## Phase 3: User Story 1 — Log an Activity (Priority: P1) 🎯 MVP

**Goal**: Users can log an activity (Call/Email/Meeting/Note) against a Contact or Deal via a drawer. Activity immediately appears at top of the feed.

**Independent Test**: From Contact detail page, click "Log Activity" → select type Call → enter subject → save → verify activity appears at top of feed with correct type, subject, author name, and timestamp.

### Implementation for User Story 1

- [X] T008 [US1] Create `ActivityService.java` (`create`: sets `author` from `SecurityContextHolder` JWT principal, `@CacheEvict` on contact/deal activity caches) in `crm-service/src/main/java/com/aicrm/module/activity/`
- [X] T009 [US1] Create `ActivityController.java` (`POST /api/activities` returning 201 + `ActivityDto`) in `crm-service/src/main/java/com/aicrm/module/activity/`
- [X] T010 [US1] Create `LogActivityDrawerComponent` (400px drawer: type selector, subject field, optional notes, optional date/time picker, optional contact/deal context shown as read-only when pre-filled) in `crm-ui/src/app/modules/activities/log-activity-drawer/`
- [X] T011 [US1] Add "Log Activity" button to `ContactDetailComponent` (`002-contacts`) that opens `LogActivityDrawerComponent` pre-filled with the current contact

**Checkpoint**: Activity can be logged from contact detail page; drawer closes on save; feed refreshes.

---

## Phase 4: User Story 2 — View Activity Feed per Contact / Deal (Priority: P1)

**Goal**: Contact/Deal detail pages show activities in reverse-chronological order with type icon, subject, author, and timestamp. Empty state when no activities.

**Independent Test**: Open contact with 5 activities → verify all 5 in reverse-chronological order → verify type icon/colour distinct per type → verify empty state on contact with no activities.

### Implementation for User Story 2

- [X] T012 [US2] Add `getByContact(contactId, page)` to `ActivityService.java` (`@Cacheable("activities-contact")`) in `crm-service/src/main/java/com/aicrm/module/activity/`
- [X] T013 [US2] Add `GET /api/activities?contactId={id}` (and `?dealId={id}`) to `ActivityController.java` (paginated, sorted by `activityDate DESC`)
- [X] T014 [US2] Create `ActivityFeedComponent` (shared component: list of activity entries — type icon/colour badge, subject, notes preview, linked contact/deal chip, author name, formatted date/time; empty state with "Log Activity" CTA) in `crm-ui/src/app/shared/components/activity-feed/`
- [X] T015 [US2] Wire `ActivityFeedComponent` into the 2/5 right panel of `ContactDetailComponent` (`002-contacts`)

**Checkpoint**: Contact detail shows activity feed in reverse-chronological order. Type icons visually distinct. Empty state shown when no activities.

---

## Phase 5: User Story 3 — Browse the Global Activity Feed (Priority: P2)

**Goal**: `/activities` shows all activities across the system, paginated, with filters for type, contact, and date range.

**Independent Test**: Navigate to `/activities` → verify activities from multiple contacts appear → filter by type "Email" → verify only emails → filter by date range → verify only activities within range.

### Implementation for User Story 3

- [X] T016 [US3] Add `getGlobal(filters, page)` to `ActivityService.java` (`@Cacheable("activities-global")`) in `crm-service/src/main/java/com/aicrm/module/activity/`
- [X] T017 [US3] Add `GET /api/activities` (global feed with query params: type, contactId, dateFrom, dateTo, page) to `ActivityController.java`
- [X] T018 [US3] Create `ActivitiesGlobalComponent` (global page: `ActivityFeedComponent` with filter bar — type dropdown, contact picker, date-range inputs, clear filters button) in `crm-ui/src/app/modules/activities/activities-global/`
- [X] T019 [US3] Register `/activities` route in `crm-ui/src/app/modules/activities/activities.routes.ts`
- [X] T020 [US3] Add "Activities" nav link to `SidebarComponent` (`001-auth`) — already present in sidebar

**Checkpoint**: Global feed loads paginated. Type/contact/date filters narrow results. Clear filters restores full feed.

---

## Phase 6: User Story 4 — Delete an Activity (Priority: P2)

**Goal**: Users can delete any activity (with confirmation); activity removed from all feeds immediately.

**Independent Test**: Hover over an activity → click Delete → confirm → verify activity removed from contact feed and global feed.

### Implementation for User Story 4

- [X] T021 [US4] Add `delete(id)` to `ActivityService.java` (`@CacheEvict` on all activity caches) in `crm-service/src/main/java/com/aicrm/module/activity/`
- [X] T022 [US4] Add `DELETE /api/activities/{id}` to `ActivityController.java` (returns 204)
- [X] T023 [US4] Add hover-reveal Delete button + `ModalComponent` confirmation to `ActivityFeedComponent` (T014); on confirm, call `ActivitiesService.deleteActivity()`, refresh feed

**Checkpoint**: Activity deletion removes entry from all feeds immediately after confirmation.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T024 [P] Write `ActivityServiceTest.java` (Mockito: create with author from principal, getByContact, getGlobal with filters, delete) in `crm-service/src/test/java/com/aicrm/activity/`
- [X] T025 [P] Write `ActivityControllerTest.java` (@SpringBootTest slice — all endpoints) in `crm-service/src/test/java/com/aicrm/activity/`
- [X] T026 Run quickstart.md validation scenarios end-to-end (deferred to runtime)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Migration)**: Depends on V6 (deals) from `003-deals-pipeline`
- **Phase 2 (Foundational)**: Depends on Phase 1
- **Phase 3 (US1 Log)**: Depends on Phase 2
- **Phase 4 (US2 Feed)**: Depends on Phase 3 (create must exist before feed can be populated)
- **Phase 5 (US3 Global)**: Depends on Phase 4 (`ActivityFeedComponent` already exists)
- **Phase 6 (US4 Delete)**: Depends on Phase 4 (`ActivityFeedComponent` needs Delete button)
- **Phase 7 (Polish)**: Depends on Phases 3–6

### Parallel Opportunities

- T002–T007: All foundational tasks work on different files
- T008 + T010: Backend service + frontend drawer
- T012 + T014: Backend feed endpoint + frontend feed component
- T016 + T018: Global backend + global frontend page
- T024 + T025: Both test classes simultaneously

---

## Notes

- `[P]` tasks have no file conflicts — safe to run concurrently
- Author is ALWAYS set server-side from `SecurityContextHolder` — never accepted from request body (constitution §II)
- `activityDate` defaults to `Instant.now()` server-side if not provided in request
- `@CacheEvict(value = "activities-contact", allEntries = true)` on create/delete evicts all pages of the affected contact's feed
- Edit is explicitly deferred (`ACT-07`); any user may delete any activity (`ACT-08`)
- `ActivityFeedComponent` is a shared component reused in Contact detail (Phase 4), Deal drawer (`003`), and global page (Phase 5)
