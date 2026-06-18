# Tasks: Contact Management

**Input**: Design documents from `specs/002-contacts/`

**Prerequisites**: spec.md ✅ · plan.md ✅ · data-model.md ✅ · contracts/contacts.md ✅ · research.md ✅ · quickstart.md ✅

**Depends on**: `001-auth` complete (User entity, JWT filter, Redis cache, GlobalExceptionHandler)

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

---

## Phase 1: Setup

**Purpose**: Flyway migrations and entity/repository scaffolding for the contact domain.

- [X] T001 Create `V2__create_companies_table.sql` Flyway migration in `crm-service/src/main/resources/db/migration/` (idempotent)
- [X] T002 Create `V3__create_contacts_table.sql` Flyway migration in `crm-service/src/main/resources/db/migration/` (FK to companies and users, ON DELETE SET NULL, indexes on email/last_name/owner_id)
- [X] T003 [P] Create `V4__create_tags_table.sql` Flyway migration in `crm-service/src/main/resources/db/migration/`
- [X] T004 [P] Create `V5__create_contact_tags_table.sql` Flyway migration in `crm-service/src/main/resources/db/migration/` (composite PK, ON DELETE CASCADE on both FKs)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core entities, repositories, and Angular module skeleton. Required before any user story.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T005 Create `Company.java` JPA entity in `crm-service/src/main/java/com/aicrm/module/company/`
- [X] T006 [P] Create `CompanyRepository.java` (JpaRepository) in `crm-service/src/main/java/com/aicrm/module/company/`
- [X] T007 Create `Tag.java` JPA entity in `crm-service/src/main/java/com/aicrm/module/tag/`
- [X] T008 [P] Create `TagRepository.java` (JpaRepository) in `crm-service/src/main/java/com/aicrm/module/tag/`
- [X] T009 Create `Contact.java` JPA entity (with ManyToOne Company/User, ManyToMany Tag via contact_tags) in `crm-service/src/main/java/com/aicrm/module/contact/`
- [X] T010 Create `ContactRepository.java` (JpaRepository with custom `findAll` JPQL supporting search + tagId filter, paginated) in `crm-service/src/main/java/com/aicrm/module/contact/`
- [X] T011 Create `TagDto.java`, `CompanyDto.java`, `ContactSummaryDto.java`, `ContactDto.java` records in `crm-service/src/main/java/com/aicrm/module/contact/dto/` and `company/dto/`
- [X] T012 Create Angular `contacts.routes.ts` (lazy-loaded routes for list, detail, create, edit) and register in `crm-ui/src/app/app.routes.ts`
- [X] T013 [P] Create Angular `ContactsService` (all API calls: getContacts, getContact, createContact, updateContact, deleteContact, getCompanies) in `crm-ui/src/app/modules/contacts/contacts.service.ts`

**Checkpoint**: Entities compile; migrations run; Angular module loads.

---

## Phase 3: User Story 1 — Create a Contact (Priority: P1) 🎯 MVP

**Goal**: Users can create a contact with required fields and optional fields, then land on the detail page.

**Independent Test**: Fill in first name, last name, email on the New Contact form → save → verify redirect to contact detail page → verify all fields display correctly.

### Implementation for User Story 1

- [X] T014 [P] [US1] Create `CreateContactRequest.java` and `UpdateContactRequest.java` records in `crm-service/src/main/java/com/aicrm/module/contact/dto/`
- [X] T015 [US1] Create `CompanyService.java` (getAll with `@Cacheable("companies::list")`) in `crm-service/src/main/java/com/aicrm/module/company/`
- [X] T016 [US1] Create `CompanyController.java` (`GET /api/companies`) in `crm-service/src/main/java/com/aicrm/module/company/`
- [X] T017 [US1] Create `ContactService.java` (`create` with `@CacheEvict("contacts::list::*")`) in `crm-service/src/main/java/com/aicrm/module/contact/`
- [X] T018 [US1] Create `ContactController.java` (`POST /api/contacts`, returns 201 + ContactDto) in `crm-service/src/main/java/com/aicrm/module/contact/`
- [X] T019 [US1] Create `ContactFormComponent` (full-page create/edit form: first name, last name, email, phone, job title, company picker, owner picker, tag multi-select, inline validation) in `crm-ui/src/app/modules/contacts/contact-form/`
- [X] T020 [US1] Register `/contacts/new` route (protected by `authGuard`) in `crm-ui/src/app/modules/contacts/contacts.routes.ts`

**Checkpoint**: New contact can be created and the detail page (placeholder) displays after save.

---

## Phase 4: User Story 2 — Search and Filter Contacts (Priority: P1)

**Goal**: Users can search by name/email/company and filter by tag; results update within 300 ms of typing pause.

**Independent Test**: With 20+ contacts, type a partial name → verify filtered results appear within 300 ms. Select a tag filter → verify only tagged contacts show.

### Implementation for User Story 2

- [X] T021 [US2] Add `findAllFiltered` search query to `ContactRepository.java` (ILIKE on first/last name, email, company name; optional tagId join) in `crm-service/src/main/java/com/aicrm/module/contact/`
- [X] T022 [US2] Add `getAll(page, size, search, tagId)` to `ContactService.java` (cache-first at `contacts::list::{page}`) in `crm-service/src/main/java/com/aicrm/module/contact/`
- [X] T023 [US2] Add `GET /api/contacts` to `ContactController.java` (paginated, query params: page, size, search, tagId)
- [X] T024 [US2] Create `ContactsListComponent` (search bar with 300 ms debounce, tag filter chips, paginated table showing name/company/email/tags, empty state) in `crm-ui/src/app/modules/contacts/contacts-list/`
- [X] T025 [US2] Register `/contacts` route in `crm-ui/src/app/modules/contacts/contacts.routes.ts`

**Checkpoint**: Contact list loads paginated; search filters in real time; tag filter narrows results; empty state shown when no matches.

---

## Phase 5: User Story 3 — View Contact Detail (Priority: P1)

**Goal**: Clicking a contact opens a 2-column detail page (3/5 info + 2/5 activity feed) showing all fields, linked deals, activities, and tasks.

**Independent Test**: Open an existing contact → verify all fields displayed → verify linked deals section, activity feed panel, and tasks section are present (may be empty stubs at this stage).

### Implementation for User Story 3

- [X] T026 [US3] Add `getById(id)` to `ContactService.java` (cache-first at `contacts::{id}`) in `crm-service/src/main/java/com/aicrm/module/contact/`
- [X] T027 [US3] Add `GET /api/contacts/{id}` to `ContactController.java` (returns ContactDto, 404 on miss)
- [X] T028 [US3] Create `ContactDetailComponent` (2-column layout: 3/5 personal info + tags + linked deals stub; 2/5 activity feed stub + tasks stub) in `crm-ui/src/app/modules/contacts/contact-detail/`
- [X] T029 [US3] Register `/contacts/:id` route in `crm-ui/src/app/modules/contacts/contacts.routes.ts`
- [X] T030 [US3] Update `ContactsListComponent` (T024) to navigate to contact detail on row click

**Checkpoint**: Clicking a contact from the list opens its detail page with all fields and section stubs.

---

## Phase 6: User Story 4 — Edit a Contact (Priority: P1)

**Goal**: Users can update any field on an existing contact and see changes reflected immediately.

**Independent Test**: Open a contact → click Edit → change phone number → save → verify new phone on detail page and in list.

### Implementation for User Story 4

- [X] T031 [US4] Add `update(id, request)` to `ContactService.java` (with `@CacheEvict` on `contacts::{id}` and `contacts::list::*`) in `crm-service/src/main/java/com/aicrm/module/contact/`
- [X] T032 [US4] Add `PUT /api/contacts/{id}` to `ContactController.java` (returns 200 + updated ContactDto)
- [X] T033 [US4] Reuse `ContactFormComponent` (T019) for edit mode: pre-populate from `GET /api/contacts/{id}`, submit to `PUT /api/contacts/{id}`
- [X] T034 [US4] Register `/contacts/:id/edit` route and add Edit button on `ContactDetailComponent` (T028)

**Checkpoint**: Contact edits persist and detail page reflects changes immediately.

---

## Phase 7: User Story 5 — Delete a Contact (Priority: P2)

**Goal**: Users can permanently delete a contact (with confirmation); linked Activities also removed; linked Tasks preserved with contact reference cleared.

**Independent Test**: Create contact with 2 linked activities and 1 linked task → delete → confirm activities gone → confirm task still exists with no contact link.

### Implementation for User Story 5

- [X] T035 [US5] Add `delete(id)` to `ContactService.java` (hard delete; DB cascade removes activities; tasks FK set null by DB; `@CacheEvict` on `contacts::{id}` and `contacts::list::*`) in `crm-service/src/main/java/com/aicrm/module/contact/`
- [X] T036 [US5] Add `DELETE /api/contacts/{id}` to `ContactController.java` (returns 204)
- [X] T037 [US5] Add Delete button + `ModalComponent` confirmation to `ContactDetailComponent` (T028); on confirm call `ContactsService.deleteContact()`, redirect to `/contacts`

**Checkpoint**: Contact deletion removes contact and linked activities; tasks preserved; user redirected to contacts list.

---

## Phase 8: Polish & Cross-Cutting Concerns

- [X] T038 [P] Add `TagService.java` (`getAll` with `@Cacheable("tags::list")`) in `crm-service/src/main/java/com/aicrm/module/tag/` (CRUD belongs to 007-admin)
- [X] T039 [P] Add seed companies data via `R__seed_dev_companies.sql` in `crm-service/src/main/resources/db/migration/` (dev only)
- [X] T040 [P] Write `ContactServiceTest.java` (Mockito: create, getAll with filter, getById, update, delete) in `crm-service/src/test/java/com/aicrm/contact/`
- [X] T041 [P] Write `ContactControllerTest.java` (@SpringBootTest slice — all 5 endpoints) in `crm-service/src/test/java/com/aicrm/contact/`
- [X] T042 Run quickstart.md validation scenarios end-to-end

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Migrations)**: Depends on `001-auth` Phase 1/2 complete (users table must exist for FK)
- **Phase 2 (Foundational)**: Depends on Phase 1
- **Phases 3–7 (User Stories)**: Each depends on Phase 2; US3/US4 share endpoints with US1/US2
- **Phase 8 (Polish)**: Depends on Phases 3–7

### Parallel Opportunities

- T001–T004: All 4 migrations can be written in parallel (different files)
- T005–T013: All foundational tasks work on different files
- T014 + T019: Backend DTOs + frontend form component
- T021 + T024: Search backend + search frontend
- T035 + T037: Delete service + delete UI
- T040 + T041: Both test classes simultaneously

---

## Parallel Example: User Story 1

```bash
# Parallel group:
Task T014: Create CreateContactRequest, UpdateContactRequest DTOs
Task T019: Create ContactFormComponent (can stub API calls)

# Sequential backend chain:
Task T015: CompanyService (depends on T006 CompanyRepository)
Task T016: CompanyController (depends on T015)
Task T017: ContactService.create (depends on T010 ContactRepository + T015)
Task T018: ContactController POST (depends on T017 + T014)
```

---

## Implementation Strategy

### MVP First (US1 — Create a Contact)

1. Complete Phase 1: Migrations
2. Complete Phase 2: Foundational
3. Complete Phase 3: US1 Create Contact
4. **STOP and VALIDATE**: Create contact → redirects to detail page → fields correct
5. Continue US2 (Search), US3 (Detail), US4 (Edit), US5 (Delete)

### Incremental Delivery

1. Migrations + Entities → DB schema ready
2. US1 → Create works end-to-end
3. US2 → List with search/filter works
4. US3 → Full detail page works
5. US4 → Edit works (reuses form component)
6. US5 → Delete with confirmation works

---

## Notes

- `[P]` tasks have no file conflicts — safe to run concurrently
- `Tag` entity and `TagService` are defined here; Tag CRUD (admin UI) lives in `007-admin`
- `Company` is read-only lookup — no create/edit/delete endpoints in this module
- Hard delete cascade is enforced at the DB level (`ON DELETE CASCADE` for activities, `ON DELETE SET NULL` for tasks contact_id) — no application-level cascade logic needed
- Search is full-dataset (not page-scoped) per CON-05 assumption
