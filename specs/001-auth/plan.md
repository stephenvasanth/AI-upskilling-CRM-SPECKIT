# Implementation Plan: Authentication & User Management

**Branch**: `001-auth` | **Date**: 2026-06-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-auth/spec.md`

---

## Summary

Implement JWT-based authentication and user profile management for the AI-CRM.
This module is the foundation for all others — it establishes the full project
structure for both `crm-ui` (Angular 20) and `crm-service` (Java 21 + Spring
Boot 3.3), the shared security infrastructure (JWT filter, role guard, global
exception handler), the Redis caching strategy, and the PostgreSQL schema via
Flyway migrations. The auth module itself covers login, logout (client-side
token removal), 8-hour session expiry with automatic redirect, and profile
name/password updates.

---

## Technical Context

**Language/Version**:
- Backend: Java 21 (LTS) — `JAVA_HOME` already set on dev machine
- Frontend: TypeScript 5.4 via Angular 20

**Primary Dependencies**:
- Backend (`crm-service`): Spring Boot 3.3.x, Spring Security 6, Spring Data JPA,
  Spring Data Redis, Spring Cache, Flyway, PostgreSQL JDBC driver, JJWT 0.12,
  Lombok, MapStruct, Bean Validation
- Frontend (`crm-ui`): Angular 20, Angular Router, Angular Reactive Forms,
  Angular HttpClient, RxJS, Angular CDK

**Storage**: PostgreSQL 16 (primary via Spring Data JPA / Hibernate) + Redis 7
(cache layer via Spring Data Redis + Spring Cache abstraction)

**Testing**:
- Backend: JUnit 5 + Spring Boot Test + Mockito + Testcontainers (PostgreSQL + Redis)
- Frontend: Jasmine + Karma (unit) · Cypress (e2e)

**Target Platform**: Desktop browsers — Chrome, Firefox, Edge latest; min 1280 px

**Project Type**: Web application — REST API (`crm-service`) + SPA (`crm-ui`)
as sibling directories at the repository root

**Performance Goals**:
- Login API response < 300 ms p95
- Angular initial bundle < 500 KB gzipped (enforced via `ng build --stats-json`)
- Redis cache hit rate > 90% for read-heavy endpoints under normal load

**Constraints**:
- JWT HS512, 8-hour expiry, secret from `JWT_SECRET` environment variable
- BCrypt strength 10 (Spring Security default)
- Logout is client-side only — token cleared from `localStorage`, no server blacklist
- CORS restricted to `FRONTEND_ORIGIN` environment variable (`http://localhost:3000` in dev)
- Backend runs on port 5000 (`SERVER_PORT=5000`); frontend on port 3000 (`ng serve --port 3000`)
- No sensitive data (tokens, hashes) at any log level (`NFR-S06`)
- Flyway migrations run automatically on startup and must be idempotent

**Scale/Scope**: 2–10 concurrent users; no rate limiting required in v1

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Requirement | Status |
|-----------|-------------|--------|
| I. Spec-Driven | `spec.md` approved before this plan | ✅ |
| II. Security by Default | JWT on all `/api/*` except `/api/auth/login`; BCrypt strength 10; generic login error; 401/403 → `/login` redirect; 8 h expiry | ✅ |
| III. API Contract Integrity | `@RestControllerAdvice` global handler returns structured JSON; user profile cached in Redis (TTL 24 h, invalidated on update/password change) | ✅ |
| IV. Design System Fidelity | Login + Profile pages use Angular components with CSS custom properties from `docs/DESIGN.md` §3 | ✅ |
| V. Data Integrity | Flyway migrations idempotent; `spring.flyway.baseline-on-migrate=true` for safe first run | ✅ |
| VI. Scope Discipline | No password-reset flow; no self-registration; desktop-only; bundle size enforced via Angular CLI | ✅ |
| VII. Roles & Permissions | `JwtAuthenticationFilter` + `@PreAuthorize` annotations established here; reused by all subsequent modules | ✅ |

**All gates pass. No complexity violations.**

---

## Project Structure

### Documentation (this feature)

```text
specs/001-auth/
├── plan.md              ← this file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── quickstart.md        ← Phase 1 output
├── contracts/
│   └── auth.md          ← Phase 1 output
└── tasks.md             ← Phase 2 output (/speckit-tasks)
```

### Source Code — crm-service (Backend)

```text
crm-service/
├── rules.md                          # backend coding standards & conventions
├── pom.xml                           # Maven build descriptor
├── src/
│   ├── main/
│   │   ├── java/com/aicrm/
│   │   │   ├── AiCrmApplication.java       # Spring Boot entry point
│   │   │   ├── config/
│   │   │   │   ├── SecurityConfig.java     # Spring Security filter chain
│   │   │   │   ├── RedisConfig.java        # RedisCacheManager, TTL 24 h
│   │   │   │   └── JwtConfig.java          # JWT secret key bean
│   │   │   ├── common/
│   │   │   │   ├── exception/
│   │   │   │   │   ├── GlobalExceptionHandler.java  # @RestControllerAdvice
│   │   │   │   │   ├── ApiException.java            # base runtime exception
│   │   │   │   │   └── ErrorCode.java               # SNAKE_CASE error codes enum
│   │   │   │   └── dto/
│   │   │   │       └── ErrorResponse.java           # { error: { code, message, fields } }
│   │   │   ├── security/
│   │   │   │   ├── JwtService.java                  # generate + validate JWT
│   │   │   │   ├── JwtAuthenticationFilter.java     # OncePerRequestFilter
│   │   │   │   └── UserPrincipal.java               # Authentication principal
│   │   │   └── module/
│   │   │       ├── auth/
│   │   │       │   ├── AuthController.java
│   │   │       │   ├── AuthService.java
│   │   │       │   └── dto/
│   │   │       │       ├── LoginRequest.java
│   │   │       │       ├── LoginResponse.java
│   │   │       │       ├── UpdateProfileRequest.java
│   │   │       │       └── ChangePasswordRequest.java
│   │   │       ├── user/               # populated by 007-admin
│   │   │       │   ├── User.java       # JPA entity
│   │   │       │   ├── UserRepository.java
│   │   │       │   └── UserService.java
│   │   │       ├── contact/            # 002-contacts
│   │   │       ├── deal/               # 003-deals-pipeline
│   │   │       ├── activity/           # 004-activities
│   │   │       ├── task/               # 005-tasks
│   │   │       └── tag/                # 007-admin
│   │   └── resources/
│   │       ├── application.yml         # base config
│   │       ├── application-dev.yml     # local overrides
│   │       └── db/migration/
│   │           └── V1__create_users_table.sql
│   └── test/
│       └── java/com/aicrm/
│           ├── auth/
│           │   ├── AuthControllerTest.java   # @SpringBootTest slice
│           │   └── AuthServiceTest.java      # Mockito unit tests
│           └── config/
│               └── TestcontainersConfig.java # shared PG + Redis containers
├── docker-compose.yml                # PostgreSQL 16 + Redis 7 for local dev
└── .env.example
```

### Source Code — crm-ui (Frontend)

```text
crm-ui/
├── rules.md                          # frontend coding standards & conventions
├── angular.json
├── tsconfig.json                     # strict: true, no implicit any
├── package.json
├── src/
│   ├── main.ts                       # bootstrapApplication(AppComponent, appConfig)
│   ├── styles/
│   │   ├── tokens.css                # CSS custom properties from DESIGN.md §3
│   │   └── reset.css
│   ├── app/
│   │   ├── app.config.ts             # provideRouter, provideHttpClient, interceptors
│   │   ├── app.routes.ts             # lazy-loaded module routes
│   │   ├── app.component.ts          # root shell (sidebar + router-outlet)
│   │   ├── core/
│   │   │   ├── interceptors/
│   │   │   │   ├── auth.interceptor.ts     # attaches Bearer token to every request
│   │   │   │   └── error.interceptor.ts    # 401/403 → clearToken + navigate /login
│   │   │   ├── guards/
│   │   │   │   ├── auth.guard.ts           # CanActivateFn — redirects if no token
│   │   │   │   └── admin.guard.ts          # CanActivateFn — redirects if not ADMIN
│   │   │   └── services/
│   │   │       └── auth.service.ts         # login(), logout(), currentUser signal
│   │   ├── shared/
│   │   │   └── components/
│   │   │       ├── button/           # ButtonComponent
│   │   │       ├── input/            # InputComponent (label + error state)
│   │   │       ├── toast/            # ToastComponent + ToastService
│   │   │       ├── modal/            # ModalComponent (confirm dialog)
│   │   │       ├── drawer/           # DrawerComponent (right-slide 400 px)
│   │   │       ├── sidebar/          # SidebarComponent (240 px, dark)
│   │   │       ├── avatar/           # AvatarComponent (initials, coloured)
│   │   │       ├── badge/            # BadgeComponent (roles, status, tags)
│   │   │       ├── empty-state/      # EmptyStateComponent
│   │   │       └── skeleton/         # SkeletonComponent (shimmer loader)
│   │   └── modules/
│   │       ├── auth/
│   │       │   ├── auth.routes.ts
│   │       │   ├── login/
│   │       │   │   ├── login.component.ts
│   │       │   │   ├── login.component.html
│   │       │   │   └── login.component.css
│   │       │   └── profile/
│   │       │       ├── profile.component.ts
│   │       │       ├── profile.component.html
│   │       │       └── profile.component.css
│   │       ├── dashboard/            # 006-dashboard
│   │       ├── contacts/             # 002-contacts
│   │       ├── deals/                # 003-deals-pipeline
│   │       ├── activities/           # 004-activities
│   │       ├── tasks/                # 005-tasks
│   │       └── admin/                # 007-admin
```

**Structure Decision**: Two sibling projects at repository root — `crm-service/`
and `crm-ui/`. Each is independently buildable and deployable. No monorepo build
tooling required; they communicate solely via the REST API at runtime.

---

## Complexity Tracking

*No constitution violations — section intentionally empty.*
