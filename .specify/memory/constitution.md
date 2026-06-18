<!--
  SYNC IMPACT REPORT
  ==================
  Version change: [TEMPLATE] → 1.0.0 (initial ratification)

  Principles added (7 total):
  - I.   Spec-Driven Development (new)
  - II.  Security by Default (new)
  - III. API Contract Integrity (new)
  - IV.  Design System Fidelity (new)
  - V.   Data Integrity & Deletion Semantics (new)
  - VI.  Scope Discipline (new)
  - VII. Roles & Permissions Enforcement (new)

  Sections added:
  - Development Standards
  - Governance

  Template propagation:
  - .specify/templates/plan-template.md ✅ Constitution Check section is already a gate placeholder — no changes needed
  - .specify/templates/spec-template.md ✅ Generic template compatible; principles reflected in requirements/assumptions sections at plan time
  - .specify/templates/tasks-template.md ✅ Phase structure aligns with spec-driven workflow; no changes needed

  Deferred items: none — all placeholders resolved
-->

# AI-CRM Constitution

## Core Principles

### I. Spec-Driven Development

All features MUST begin with approved spec.md → plan.md → tasks.md artifacts before any implementation
code is written. The specification is the authoritative source of truth; implementation follows it,
not the reverse. No task may be started unless it appears in an approved tasks.md derived from a
completed spec and plan.

### II. Security by Default

- JWT-based authentication is MANDATORY on all `/api/*` endpoints except `/api/auth/login`.
- Tokens expire after 8 hours; the client MUST redirect to `/login` on expiry or any 401/403 response.
- Passwords MUST be stored as BCrypt hashes with a minimum length of 8 characters.
- Failed login attempts MUST return a generic error message — no email-vs-password differentiation
  is permitted (prevents user enumeration).
- API endpoints MUST NOT expose implementation details, stack traces, or internal identifiers in
  error responses.

### III. API Contract Integrity

- The backend MUST always return structured JSON error responses — HTML error pages are never
  acceptable from any `/api/*` route.
- All error response shapes MUST be consistent across every endpoint (same field names, same
  envelope structure).
- Every read MUST check Redis first; on cache miss fetch from PostgreSQL, populate Redis (TTL 24 h),
  then return. All writes (create/update/delete) MUST immediately invalidate affected cache keys.

### IV. Design System Fidelity

- All UI components MUST use design tokens defined in `docs/CRM_Design.docx` §3 (colour palette,
  typography, 8px spacing grid, border radii, shadows, animation specs). No ad-hoc values.
- Interaction patterns are fixed:
  - **Drawers** (right-slide, 400px): create/edit Deal, log Activity, create/edit Task, create Tag.
  - **Full pages**: Contact create/edit; Contact detail (2-column: 3/5 details + 2/5 activity feed).
- Optimistic UI MUST be applied to Task-complete toggle and Deal Kanban stage drag; server errors
  MUST trigger an automatic revert and a toast notification.
- Toast configuration: top-right position, max 3 visible simultaneously, auto-dismiss after 4 s.
- All CSS transitions and animations MUST respect the `prefers-reduced-motion` media query.

### V. Data Integrity & Deletion Semantics

- Database migrations MUST be idempotent and MUST run automatically on application startup.
- Contact deletion is a **hard delete**: directly-linked Activities are also deleted; linked Tasks
  have their Contact foreign key cleared (Tasks are preserved).
- All write operations (create, update, delete) MUST invalidate the relevant Redis cache entries
  immediately.

### VI. Scope Discipline

- The application is **desktop-only**: minimum supported width is 1280 px (optimised for 1440 px+).
  No mobile or tablet layout work is permitted in this release.
- The initial JavaScript bundle MUST remain below 500 KB gzipped.
- The following features are **explicitly deferred** to a future release and MUST NOT be
  implemented now: full Company CRUD / detail views; editing existing Activities;
  author-restricted Activity deletion.
- Any deviation from deferred scope or desktop-only constraint requires explicit written approval
  and a constitution amendment.

### VII. Roles & Permissions Enforcement

- Two roles exist: **USER** and **ADMIN**. Role checks MUST be enforced server-side on every
  relevant endpoint — client-side role checks are supplementary only, never authoritative.
- ADMIN-only operations: view/create/deactivate users; change user roles; manage Tags.
- Both roles have full CRUD on Contacts, Deals, Activities, and Tasks, plus view access to the
  companies lookup and the ability to manage their own profile.

## Development Standards

| Concern | Requirement |
|---------|-------------|
| Auth token lifetime | 8 h; client redirects to `/login` on expiry or 401/403 |
| Password storage | BCrypt hash, min 8 chars, generic error on failure |
| Caching layer | Redis cache-first reads; TTL 24 h; immediate invalidation on every write |
| Project structure | `crm-ui/` (Angular 20) + `crm-service/` (Java 21 + Spring Boot 3.3) |
| DB migrations | Idempotent; auto-run on startup |
| Bundle size | < 500 KB gzipped (initial load) |
| Viewport support | Desktop only, min 1280 px |
| Pipeline stages | Lead → Qualified → Proposal → Negotiation → Closed Won → Closed Lost (fixed) |
| Closed Lost cards | Visually muted at opacity 0.6 |
| Kanban columns | Display deal count + total value per column |

## Governance

This constitution supersedes all other practices and documentation where conflicts exist. Amendments
require:

1. A documented rationale explaining why the principle must change.
2. A semantic version bump:
   - **MAJOR** — principle removal or backward-incompatible redefinition.
   - **MINOR** — new principle or section added; material scope expansion.
   - **PATCH** — clarification, wording fix, non-semantic refinement.
3. Propagation review: all `.specify/templates/*.md` files must be checked for outdated references
   after any amendment, and updated where necessary.
4. All pull requests and implementation reviews MUST verify compliance with the principles above.
   Complexity violations require a justified entry in the plan's Complexity Tracking table.

**Version**: 1.0.1 | **Ratified**: 2026-06-16 | **Last Amended**: 2026-06-16
