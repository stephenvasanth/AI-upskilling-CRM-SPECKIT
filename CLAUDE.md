# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository State

This repository is in the **implementation phase** — modules 001–006 are complete. Source-of-truth design material:

- `docs/REQUIREMENTS.md` / `docs/CRM_Requirements.docx` — functional & non-functional requirements (source of
  truth for *what* to build; both files are kept in sync — edit the `.md` and regenerate the `.docx`)
- `docs/DESIGN.md` / `docs/CRM_Design.docx` — UI/UX design spec: design tokens, screens, components,
  navigation, interaction patterns (source of truth for *how it should look/behave*; same sync policy)

GitHub's **Spec Kit** (`specify` CLI, installed via `uv tool install specify-cli --from
git+https://github.com/github/spec-kit.git`) has been initialized in this directory. The spec-driven
workflow order is:

1. `/speckit-constitution` — ✅ done (`specs/memory/constitution.md` v1.0.0, ratified 2026-06-16)
2. `/speckit-specify` — ✅ done (7 module specs created, module-wise approach)
3. `/speckit-clarify` (optional) — de-risk ambiguous areas before planning
4. `/speckit-plan` — ✅ done (all 7 module plans created)
5. `/speckit-tasks` — ✅ done (all 7 module tasks.md files generated)
6. `/speckit-analyze` (optional) — cross-artifact consistency check
7. `/speckit-checklist` (optional) — quality checklist for requirements
8. `/speckit-implement` — execute implementation

### Module Specs (all in `specs/`)

| Directory | Module | Status |
|-----------|--------|--------|
| `001-auth` | Authentication & User Management | ✅ spec ✅ plan ✅ tasks ✅ implemented |
| `002-contacts` | Contact Management | ✅ spec ✅ plan ✅ tasks ✅ implemented |
| `003-deals-pipeline` | Deals Pipeline (Kanban) | ✅ spec ✅ plan ✅ tasks ✅ implemented |
| `004-activities` | Activity Logging | ✅ spec ✅ plan ✅ tasks ✅ implemented |
| `005-tasks` | Task Management | ✅ spec ✅ plan ✅ tasks ✅ implemented |
| `006-dashboard` | Dashboard | ✅ spec ✅ plan ✅ tasks ✅ implemented |
| `007-admin` | Admin — Users & Tags | ✅ spec ✅ plan ✅ tasks ✅ implemented |

### ⚠️ Pre-Implementation Gate: Design Sync Check

**Before running `/speckit-implement` on any frontend module**, the stitch.ai design output MUST be
cross-checked against `docs/DESIGN.md`. Specifically verify:

1. **Design tokens** — confirm all colour, typography, spacing, radius, and shadow values in the
   stitch.ai output match the tokens in `docs/DESIGN.md` §3. Update `docs/DESIGN.md` (and regenerate
   the `.docx`) if stitch.ai deviates.
2. **Screen layouts** — confirm each screen (Login, Dashboard, Contact List, Contact Detail, Contact
   Form, Deal Board, Task List, Activity Feed) matches the layout specs in `docs/DESIGN.md` §5.
3. **Components** — confirm drawer dimensions (400px), sidebar width (240px), column widths, card
   styles, toast behaviour, and animation specs match `docs/DESIGN.md` §6–§10.
4. **Update `docs/DESIGN.md`** with any approved deviations from the stitch.ai output before
   implementation begins — the `.md` file is always the implementation source of truth.

This check applies module-by-module: frontend tasks for a module MUST NOT start until the relevant
screens from stitch.ai have been verified against `docs/DESIGN.md`.

Note: this directory is **not yet a git repository**.

## Project Summary

A web-based CRM for small teams (2–10 users), desktop browsers only (min width 1280px, optimised for 1440px+).
Single-page app with a persistent left sidebar (240px, dark) covering five modules: **Dashboard, Contacts, Deals
(Kanban), Activities, Tasks**, plus admin-only **Users** and **Tags** management.

### Domain Model / Glossary
- **Contact** — an individual tracked in the CRM; can link to a Company, have multiple Tags, an Owner, and related Deals/Activities/Tasks.
- **Company** — currently a **read-only lookup** (id + name) used only to populate the company picker on the Contact form. Full company CRUD/detail views are deferred to a future release.
- **Deal** — a sales opportunity linked to a Contact, progressing through pipeline stages.
- **Activity** — a logged interaction (Call / Email / Meeting / Note) against a Contact or Deal.
- **Task** — an actionable to-do with a due date and assignee, optionally linked to a Contact/Deal.
- **Tag** — a coloured label assignable to Contacts (admin-managed).
- **Owner** — the team member responsible for a Contact or Deal.

### Deal Pipeline Stages (fixed order)
`Lead → Qualified → Proposal → Negotiation → Closed Won → Closed Lost`
Closed Lost cards are visually muted (opacity 0.6). Each Kanban column shows deal count + total value.

### Roles & Permissions
Two roles: **USER** and **ADMIN**.
- Both roles: full CRUD on Contacts, Deals, Activities, Tasks; view companies lookup; manage own profile.
- **ADMIN only**: view/create/deactivate users, change user roles, manage Tags.

## Architectural Constraints (from NFRs — binding for implementation)

- **Auth**: JWT-based; all `/api/*` endpoints except `/api/auth/login` require a valid JWT; tokens expire after 8h
  (client redirects to `/login` on expiry/403). Passwords stored as BCrypt hashes, min 8 chars. Failed login returns
  a generic error (no email-vs-password hint).
- **Caching**: Frequently-read data served cache-first from **Redis**, falling back to DB on miss; TTL = 24h,
  invalidated on writes.
- **API errors**: backend always returns structured JSON errors, never HTML error pages.
- **DB migrations**: must be idempotent and run automatically on startup.
- **Frontend**: initial bundle < 500KB gzipped; desktop-only, no mobile/tablet layout.
- **Deletion semantics**: deleting a Contact is a **hard delete** that also removes directly-linked Activities, but
  preserves linked Tasks (with the Contact reference cleared).
- **Deferred (not in current scope)**: full Company CRUD/detail view, editing existing Activities, and
  author-restricted Activity deletion.

## Design System Essentials

Full design tokens (colour palette, typography, spacing 8px grid, radii, shadows, animation specs) are defined in
`docs/DESIGN.md` §3 (and mirrored in `docs/CRM_Design.docx`) — use the `.md` file as the source for any CSS
variables / theme config. If stitch.ai output has been verified and differs, `docs/DESIGN.md` will have been
updated before implementation — always read the current file, not a cached value.

Key UI patterns to preserve:
- **Drawers** (right-slide, 400px) for: create/edit Deal, log Activity, create/edit Task, create Tag.
- **Full pages** for: Contact create/edit and Contact detail (2-column: 3/5 details + 2/5 activity feed).
- **Optimistic UI** for Task-complete toggle and Deal stage changes via Kanban drag (revert + toast on server error).
- Toasts top-right, max 3 visible, auto-dismiss after 4s.
- All animations must respect `prefers-reduced-motion`.

## Tooling

- `uv` / `uvx` — Python tool/package manager, installed at `~/.local/bin` (on PATH).
- `specify` — Spec Kit CLI (installed via `uv tool install`). Run `specify check` to verify supported AI agents.

<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan at
`specs/001-auth/plan.md`. This plan establishes the global tech stack and
monorepo structure used by all 7 modules:
- Backend (`crm-service`): Java 21 + Spring Boot 3.3 + Spring Security 6 + Spring Data JPA + PostgreSQL 16 + Redis 7 (Spring Data Redis) + Flyway + JJWT 0.12 + Lombok + MapStruct
- Frontend (`crm-ui`): Angular 20 + TypeScript 5.4 + Angular Router + Angular Reactive Forms + Angular HttpClient + RxJS + Angular CDK
- Styling: CSS custom properties (design tokens from `docs/DESIGN.md` §3)
- Testing: JUnit 5 + Spring Boot Test + Mockito + Testcontainers (BE) · Jasmine + Karma + Cypress (FE)
- Project layout: `crm-service/` and `crm-ui/` as sibling directories at the repo root
- Ports: backend on 5000, frontend on 3000
<!-- SPECKIT END -->
