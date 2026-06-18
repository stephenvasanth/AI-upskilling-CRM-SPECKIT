# Implementation Plan: Contact Management

**Branch**: `002-contacts` | **Date**: 2026-06-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/002-contacts/spec.md`
**Depends on**: `001-auth` (User entity, JWT filter, Redis cache, Flyway baseline)

---

## Summary

Implement full CRUD for Contacts — the central entity of the CRM. Includes the
Contacts list page (paginated, searchable, tag-filterable), Contact detail page
(2-column: 3/5 info + 2/5 activity feed), full-page create/edit form, and
confirmation-gated hard delete that cascades to linked Activities while preserving
Tasks. Also scaffolds the Company lookup (read-only) and the ContactTag join table
used by module 007-admin.

---

## Technical Context

**Stack**: Java 21 + Spring Boot 3.3 (`crm-service/`) · Angular 20 (`crm-ui/`)
**New files added to** (see Project Structure below for full paths):
- `crm-service/`: `ContactController`, `ContactService`, `ContactRepository`,
  `Contact` entity, `Company` entity, `CompanyRepository`, `CompanyController`
- `crm-ui/`: `contacts/` module (list, detail, form components)
- Flyway: `V2__create_companies_table.sql`, `V3__create_contacts_table.sql`,
  `V4__create_tags_table.sql`, `V5__create_contact_tags_table.sql`

**Key dependencies on 001-auth**:
- `User` entity (owner field on Contact)
- `JwtAuthenticationFilter` (all endpoints protected)
- `GlobalExceptionHandler`, `ErrorResponse` (error envelope)
- Redis `RedisCacheManager` (cache-first pattern extended to contacts)

**Performance goals**:
- Search results within 300 ms of debounce (NFR-P01, CON-05)
- First page (20 records) within 1 second (SC-005)
- Contact detail page within 1 second

**Constraints**:
- Hard delete: `ON DELETE CASCADE` for Activities; `ON DELETE SET NULL` for Tasks
- Search is full-dataset, not page-scoped (CON-05 assumption)
- Company field is read-only lookup; no Company create from Contact form
- Avatar (CON-11) is initials-only in this release; image upload deferred

---

## Constitution Check

| Principle | Requirement | Status |
|-----------|-------------|--------|
| I. Spec-Driven | `spec.md` approved; depends on `001-auth` plan complete | ✅ |
| II. Security by Default | All `/api/contacts/**` and `/api/companies/**` require JWT | ✅ |
| III. API Contract Integrity | Cache-first on list + detail; invalidate on every write | ✅ |
| IV. Design System Fidelity | Contact list, detail (2-col), and form match `docs/DESIGN.md` §5 | ✅ |
| V. Data Integrity | Hard delete + cascade; FK constraints in Flyway migrations | ✅ |
| VI. Scope Discipline | No Company CRUD; no avatar upload; desktop-only | ✅ |
| VII. Roles & Permissions | Both USER and ADMIN have full Contact CRUD | ✅ |

---

## Project Structure — New Files

### crm-service additions
```text
src/main/java/com/aicrm/
├── module/
│   ├── contact/
│   │   ├── Contact.java
│   │   ├── ContactRepository.java
│   │   ├── ContactService.java
│   │   ├── ContactController.java
│   │   └── dto/
│   │       ├── ContactDto.java
│   │       ├── ContactSummaryDto.java
│   │       ├── CreateContactRequest.java
│   │       └── UpdateContactRequest.java
│   ├── company/
│   │   ├── Company.java
│   │   ├── CompanyRepository.java
│   │   ├── CompanyService.java
│   │   └── CompanyController.java
│   └── tag/                     # Tag entity lives here; CRUD in 007-admin
│       ├── Tag.java
│       └── TagRepository.java
resources/db/migration/
├── V2__create_companies_table.sql
├── V3__create_contacts_table.sql
├── V4__create_tags_table.sql
└── V5__create_contact_tags_table.sql
```

### crm-ui additions
```text
src/app/modules/contacts/
├── contacts.routes.ts
├── contacts-list/
│   ├── contacts-list.component.ts    # search + tag filter + pagination
│   ├── contacts-list.component.html
│   └── contacts-list.component.css
├── contact-detail/
│   ├── contact-detail.component.ts   # 2-col layout
│   ├── contact-detail.component.html
│   └── contact-detail.component.css
└── contact-form/
    ├── contact-form.component.ts      # create + edit (full page)
    ├── contact-form.component.html
    └── contact-form.component.css
```

---

## Complexity Tracking

*No constitution violations — section intentionally empty.*
