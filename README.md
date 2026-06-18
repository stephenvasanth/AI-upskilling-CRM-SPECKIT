# AI-CRM

A web-based Customer Relationship Management system for small teams (2–10 users). It centralises contact management, sales pipeline tracking, activity logging, and task management in a single desktop application secured by role-based authentication.

---

## What It Does

| Module | Description |
|--------|-------------|
| **Dashboard** | Landing page showing open tasks, recent activities, and pipeline summary by stage |
| **Contacts** | Full CRUD with search, tag filtering, pagination, and a detail view showing linked deals, activities, and tasks |
| **Deals Pipeline** | Kanban board with six fixed stages (Lead → Qualified → Proposal → Negotiation → Closed Won → Closed Lost); drag-and-drop stage changes with optimistic UI |
| **Activities** | Log calls, emails, meetings, and notes against contacts or deals; global activity feed across the whole team |
| **Tasks** | Create and assign tasks with due dates; filter by assignee, status, or due date; overdue tasks are highlighted |
| **Admin** | Admins can create/deactivate users, change roles, and manage the tag library |
| **Auth** | JWT-based login (8-hour sessions), profile name/password updates, automatic redirect to login on session expiry |

### Roles

| Role | Access |
|------|--------|
| **USER** | Full CRUD on contacts, deals, activities, and tasks; view own profile |
| **ADMIN** | Everything a USER can do, plus user management and tag management |

---

## Tech Stack

### Backend — `crm-service/`

| Technology | Version | Purpose |
|------------|---------|---------|
| Java | 21 LTS | Runtime |
| Spring Boot | 3.3.5 | Application framework |
| Spring Security 6 | — | JWT authentication, role-based access |
| Spring Data JPA / Hibernate | — | ORM, PostgreSQL access |
| Spring Data Redis | — | Cache layer (TTL 24 h, write-through invalidation) |
| Flyway | — | Automatic schema migrations on startup |
| JJWT | 0.12.6 | JWT signing (HS512) and validation |
| MapStruct | 1.5.5 | Entity ↔ DTO mapping |
| Lombok | — | Boilerplate reduction |
| PostgreSQL | 16 | Primary database |
| Redis | 7 | Cache store |

### Frontend — `crm-ui/`

| Technology | Version | Purpose |
|------------|---------|---------|
| Angular | 20 | SPA framework |
| TypeScript | 5.4 | Language |
| Angular Router | — | Client-side routing with auth guards |
| Angular Reactive Forms | — | Form handling and inline validation |
| Angular CDK | — | Drag-and-drop (Kanban board) |
| RxJS | — | Async data streams |

### Infrastructure

| Component | Purpose |
|-----------|---------|
| Docker & Docker Compose | Runs all four services (Postgres, Redis, backend, frontend) with a single command |
| nginx | Serves the Angular SPA and proxies `/api/` requests to the backend |

---

## Project Structure

```
AI-upskilling-CRM-SPECKIT/
├── crm-service/          # Spring Boot backend (port 5000)
│   ├── src/
│   │   ├── main/java/com/aicrm/
│   │   │   ├── module/   # Feature modules (auth, contacts, deals, …)
│   │   │   ├── security/ # JWT filter, UserPrincipal
│   │   │   ├── config/   # Security, Redis, CORS config
│   │   │   └── common/   # Global exception handler, DTOs
│   │   └── resources/db/migration/   # Flyway SQL migrations
│   └── pom.xml
├── crm-ui/               # Angular frontend (port 3000)
│   └── src/app/
│       ├── core/         # Auth service, HTTP interceptor, guards
│       ├── modules/      # Feature modules (auth, contacts, deals, …)
│       └── shared/       # Reusable components (Button, Drawer, Toast, …)
├── docker-compose.yml    # Runs all four services
├── .env.example          # Environment variable template
└── specs/                # Design artifacts (spec, plan, tasks per module)
```

---

## Running Locally

### Prerequisites

| Requirement | Version | Check |
|-------------|---------|-------|
| Docker Desktop | Latest | `docker --version` |
| Docker Compose | v2+ | `docker compose version` |

> No JDK, Node.js, or Maven needed — everything runs inside Docker containers.

### 1. Clone the repository

```bash
git clone <repository-url>
cd AI-upskilling-CRM-SPECKIT
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and set a secure `JWT_SECRET` (minimum 64 characters). You can generate one with:

```bash
openssl rand -hex 64
```

Paste the output as the value of `JWT_SECRET` in `.env`. All other defaults work as-is for local development.

### 3. Start the stack

```bash
docker-compose up -d
```

This starts all four services in dependency order:

| Service | URL | Notes |
|---------|-----|-------|
| PostgreSQL | `localhost:5433` | Flyway migrations run automatically on first start |
| Redis | `localhost:6379` | Cache store |
| Backend API | `http://localhost:5000` | Spring Boot; seeded with an admin account on first run |
| Frontend | `http://localhost:3000` | Angular SPA served via nginx |

First startup takes 1–2 minutes while Docker pulls images and builds the application containers.

### 4. Open the app

Navigate to **http://localhost:3000** in a desktop browser (Chrome, Firefox, or Edge; minimum width 1280 px).

**Default admin credentials:**

| Field | Value |
|-------|-------|
| Email | `admin@aicrm.local` |
| Password | `Admin1234!` |

> Change the admin password after first login via **Profile → Change Password**.

### 5. Stop the stack

```bash
docker-compose down
```

Your database is persisted in a Docker named volume (`crm-postgres-data`) and will be intact the next time you run `docker-compose up -d`.

> **Warning:** `docker-compose down -v` deletes all volumes and wipes the database permanently. Only use this when you want a completely clean slate.

---

## Rebuilding After Code Changes

If you modify source code, rebuild the affected image before starting:

```bash
# Rebuild everything
docker-compose up -d --build

# Rebuild backend only
docker-compose up -d --build crm-service

# Rebuild frontend only
docker-compose up -d --build crm-ui
```

---

## Running Tests

Tests do not require a running stack — the backend uses Testcontainers to spin up its own database.

```bash
# Backend — JUnit 5 + Testcontainers
cd crm-service
mvn test

# Frontend — Jasmine + Karma (headless)
cd crm-ui
npm install
npm test -- --watch=false --browsers=ChromeHeadless
```

---

## Default Seed Data

On first startup Flyway applies two repeatable seed scripts:

- **Admin user** — `admin@aicrm.local` / `Admin1234!` (role: ADMIN)
- **Companies** — a set of sample company names available in the contact form company picker

All other data (contacts, deals, activities, tasks) is created through the application.
