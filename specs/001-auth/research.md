# Research: Authentication & User Management

**Feature**: `001-auth` | **Date**: 2026-06-16

---

## Decision 1: Backend Framework & Runtime

**Decision**: Java 21 + Spring Boot 3.3.x (`crm-service/`)

**Rationale**:
- Java 21 is the current LTS (supported until September 2031); JDK 21 is already
  installed at `JAVA_HOME` on the dev machine — no additional setup required
- Spring Boot 3.3 requires Java 17 minimum; Java 21 gives us virtual threads
  (Project Loom) via `spring.threads.virtual.enabled=true` — trivial performance
  boost for I/O-bound work at no extra dependency cost
- Spring Security 6 ships with Spring Boot 3.3 and provides first-class JWT filter
  support via `OncePerRequestFilter`; `@PreAuthorize` handles role checks at the
  method level without boilerplate
- Spring Data JPA (Hibernate 6.4) + Spring Data Redis ships as a coherent platform
  — no version mismatch between ORM, cache, and web tier
- Layered architecture (Controller → Service → Repository) is enforced by the
  framework conventions; aligns with `crm-service/rules.md`
- Maven is the build tool — `mvnw` wrapper ships with Spring Initializr; no extra
  install needed

**Alternatives considered**:
- **Quarkus** — excellent cold-start and native image support, but adds GraalVM
  complexity with no benefit for a small-team CRM with 2–10 users
- **Micronaut** — compile-time DI is appealing, but smaller ecosystem for Spring
  Security-equivalent JWT handling; less documentation for CRM patterns
- **Node.js / Fastify** — wrong runtime; project specification requires Java backend

---

## Decision 2: Frontend Framework & Build Tool

**Decision**: Angular 20 + Angular CLI (`crm-ui/`)

**Rationale**:
- Angular 20 ships as standalone-by-default; no `NgModule` boilerplate required
  — every component is `standalone: true`; modules are route-level lazy-load units
- Angular 20 signals (`signal()`, `computed()`, `effect()`) replace RxJS for
  local/derived state; `HttpClient` returns `Observable` for server calls (RxJS
  interop maintained)
- Angular Router with `loadComponent` / `loadChildren` enables lazy loading per
  module — critical for the 500 KB bundle constraint (constitution principle VI)
- Typed Reactive Forms (`FormGroup<T>`) provide compile-time safety on all form
  fields — aligns with `crm-ui/rules.md` strict TypeScript requirement
- Angular CDK provides drag-and-drop primitives (`CdkDragDrop`) for the Kanban
  board (003-deals-pipeline); no extra DnD library required
- New control flow (`@if`, `@for`) reduces template boilerplate vs `*ngIf`/`*ngFor`
- Angular CLI 20 (`ng build --stats-json`) enforces bundle budget checks natively;
  build fails if initial bundle exceeds configured budget

**Alternatives considered**:
- **React 18 + Vite** — wrong framework; project specification requires Angular
- **Vue 3 + Vite** — wrong framework; project specification requires Angular
- **Angular Universal (SSR)** — explicitly excluded; the app is a desktop-only
  authenticated SPA; SSR adds complexity with zero user-facing benefit

---

## Decision 3: ORM & Database Migration Strategy

**Decision**: Spring Data JPA (Hibernate 6.4) + Flyway Core + PostgreSQL 16

**Rationale**:
- Spring Data JPA ships with Spring Boot 3.3; no extra version to manage; JPA
  entities are annotated Java classes — the data model document maps directly
- Hibernate 6.4 supports Java records and improved batch processing; `@Column`,
  `@Enumerated`, `@CreationTimestamp`, `@UpdateTimestamp` cover every field in
  the User entity
- Flyway is the simplest migration strategy for this project: SQL scripts in
  `src/main/resources/db/migration/` are versioned `V{n}__{description}.sql`;
  Flyway auto-runs on startup when `spring.flyway.enabled=true` (default in Boot)
- Flyway scripts are idempotent by nature (`CREATE TABLE IF NOT EXISTS`, `CREATE
  INDEX IF NOT EXISTS`) — satisfies constitution principle V
- PostgreSQL 16 provides `gen_random_uuid()` for UUID primary keys, JSONB for
  future flexible data, and full-text search for the Contacts module

**Alternatives considered**:
- **Liquibase** — more features (YAML/XML format), but Flyway's plain SQL is more
  readable and easier to review in pull requests; adequate for this scope
- **Spring Data JDBC** — lighter than JPA but loses lazy loading and cascade; JPA
  is the better fit given the cross-module entity relationships
- **R2DBC (reactive)** — Spring Boot 3.3 supports reactive JDBC, but the auth
  module is I/O-bound, not throughput-bound; blocking JPA + virtual threads is
  simpler and sufficient

---

## Decision 4: Authentication Strategy

**Decision**: Stateless JWT (HS512) in `localStorage`, 8-hour expiry, Spring Security 6

**Rationale**:
- JWT is explicitly required by the constitution (principle II) and NFR-S01
- HS512 is stronger than HS256 at negligible cost; JJWT 0.12 (`io.jsonwebtoken`)
  supports it natively and integrates cleanly with Spring Security
- 8-hour expiry is defined in the constitution (v1.0.1) and spec AUTH-02
- Secret loaded from `JWT_SECRET` environment variable (never hardcoded); validated
  at startup via `@Value` + `@PostConstruct` assertion
- `JwtAuthenticationFilter extends OncePerRequestFilter` is placed before
  `UsernamePasswordAuthenticationFilter` in the Spring Security filter chain;
  extracts and validates the token, then populates `SecurityContextHolder`
- BCrypt strength 10 is Spring Security's default via `BCryptPasswordEncoder`
- Logout is client-side only — token cleared from Angular `localStorage`; no
  server-side blacklist needed for 2–10 users over an 8 h window
- `@PreAuthorize("hasRole('ADMIN')")` on ADMIN endpoints; evaluated after the JWT
  filter populates the security context

**Spring Security configuration**:
- `/api/auth/login` → `permitAll()`
- All other `/api/**` → `authenticated()`
- `SessionCreationPolicy.STATELESS` — no HTTP session
- CORS configured to allow only `FRONTEND_ORIGIN` environment variable origin

**Alternatives considered**:
- **Spring Session + Redis** — stateful sessions with Redis store; adds server-side
  session management complexity; JWT is the stated requirement
- **OAuth2 / Keycloak** — enterprise-grade but massive operational overhead for a
  self-hosted 2–10 user tool; out of scope per constitution principle VI
- **HttpOnly cookies** — more XSS-resistant but introduces CSRF complexity with
  Angular's HttpClient; `localStorage` + interceptor is sufficient for a
  desktop-only internal tool

---

## Decision 5: Caching Layer

**Decision**: Redis 7 via Spring Data Redis + Spring Cache abstraction

**Rationale**:
- Redis is explicitly required by NFR-P03 and constitution principle III
- Spring Cache abstraction (`@Cacheable`, `@CacheEvict`) with
  `RedisCacheManager` backend provides declarative cache-first reads and
  write-through invalidation with minimal boilerplate
- `@Cacheable(value = "users", key = "#id")` on `UserService.getById()` —
  cache hit on Redis; miss fetches from PostgreSQL, populates Redis, returns result
- `@CacheEvict(value = "users", key = "#userId")` on profile update and password
  change operations — immediate invalidation on every write
- TTL configured globally in `RedisConfig` via `RedisCacheConfiguration`:
  `entryTtl(Duration.ofHours(24))`
- `RedisTemplate<String, Object>` with Jackson `GenericJackson2JsonRedisSerializer`
  serialises DTOs as JSON — human-readable in Redis CLI, debuggable

**Cache key conventions (established here, shared across all modules)**:

| Key pattern | Value cached | Invalidated on |
|-------------|-------------|----------------|
| `users::{id}` | `UserDto` (id, email, displayName, role, status) | `PUT /api/auth/profile`, `PUT /api/auth/password`, deactivation (007) |
| `contacts::list::{page}` | Paginated contact list | Any contact write (002) |
| `contacts::{id}` | Single contact detail | Contact update/delete (002) |
| `deals::board` | Full Kanban board state | Any deal write (003) |
| `tags::list` | All tags | Tag create/delete (007) |

> **Note**: Spring Cache generates keys as `cacheName::key` by default with
> `RedisCacheManager`. The double-colon (`::`) separator is the Spring convention.

**Alternatives considered**:
- **Caffeine (in-process cache)** — zero network overhead but not shared across
  instances and cannot be externally inspected; Redis is the stated requirement
- **Lettuce (direct client)** — Spring Data Redis uses Lettuce under the hood;
  using it directly bypasses the Spring Cache abstraction and loses `@Cacheable`
- **Manual cache logic** — explicit `if (redis.exists()) ... else fetchFromDb()`
  in every service method; error-prone vs declarative annotations

---

## Decision 6: Angular Auth State Management

**Decision**: Angular `AuthService` with `signal()`-based state + `localStorage`

**Rationale**:
- Angular 20 signals provide reactive auth state without external libraries
- `AuthService` is a `providedIn: 'root'` singleton injected wherever auth state
  is needed; no NgRx or Zustand required for a simple auth token store
- `signal<AuthUser | null>(null)` as `currentUser` is readable in templates and
  guards via `currentUser()`; `computed(() => currentUser()?.role)` derives role
- `localStorage` persists the JWT across page refreshes; `AuthService` reads it on
  construction and validates expiry before setting `currentUser`
- `AuthInterceptor` (functional interceptor via `withInterceptors()`) attaches the
  Bearer token to every outgoing `HttpRequest` automatically
- `ErrorInterceptor` catches `HttpErrorResponse` with status 401 or 403, calls
  `authService.clearAuth()`, and routes to `/login`
- `authGuard` (`CanActivateFn`) checks `authService.currentUser()` — if null,
  redirects to `/login`; `adminGuard` additionally checks `role === 'ADMIN'`

**Alternatives considered**:
- **NgRx Store** — correct for large apps; heavy boilerplate for a single auth
  slice with 2–10 users; signals are sufficient
- **RxJS BehaviorSubject** — valid pre-signals pattern; signals are the Angular 20
  idiomatic choice and simpler to consume in templates (`currentUser()` vs
  `async pipe`)
- **sessionStorage** — cleared on tab close; poor UX if user opens a new tab;
  `localStorage` with 8 h expiry enforced by the JWT itself is cleaner

---

## Decision 7: Styling Strategy

**Decision**: Global CSS custom properties from `docs/DESIGN.md` §3 + component-scoped styles

**Rationale**:
- Design tokens are fully defined in `docs/DESIGN.md` §3 — mapped 1-to-1 to CSS
  custom properties in `crm-ui/src/styles/tokens.css`; no interpretation needed
- Angular's default `ViewEncapsulation.Emulated` scopes component CSS without
  a CSS Modules build step; styles defined in `component.css` are auto-prefixed
- Global `tokens.css` is imported in `styles` array of `angular.json` — available
  application-wide without explicit imports in each component
- No Tailwind: the design token set is comprehensive; Tailwind would require
  re-mapping tokens and risks drift from the design spec
- Bundle impact: zero — CSS custom properties add no JavaScript to the bundle

**Alternatives considered**:
- **Angular Material** — opinionated component library that would conflict with the
  custom design system; rejected in favour of hand-rolled components
- **PrimeNG** — same concern as Angular Material; custom design tokens are the
  source of truth per constitution principle IV
- **SCSS/SASS** — adds a preprocessor step; plain CSS custom properties achieve the
  same token-driven theming without the build dependency

---

## Decision 8: Error Response Envelope

**Decision**: Consistent JSON error shape via `@RestControllerAdvice`

`GlobalExceptionHandler` (`@RestControllerAdvice`) intercepts all exceptions and
returns:

```json
{
  "error": {
    "code": "SNAKE_CASE_CODE",
    "message": "Human-readable description safe to display",
    "fields": {
      "fieldName": "Field-specific validation message"
    }
  }
}
```

- `fields` is only present on `MethodArgumentNotValidException` (HTTP 422)
- `code` values are stable string constants from the `ErrorCode` enum
- Spring's default `BasicErrorController` (HTML error pages) is disabled via
  `server.error.whitelabel.enabled=false` — satisfies constitution principle III
- `ErrorCode` enum covers: `AUTH_FAILED`, `UNAUTHORIZED`, `FORBIDDEN`,
  `NOT_FOUND`, `VALIDATION_ERROR`, `CONFLICT`, `INVALID_PASSWORD`, `INTERNAL_ERROR`

---

## Summary of Technology Decisions

| Area | Decision |
|------|----------|
| Backend runtime | Java 21 LTS (virtual threads enabled) |
| Backend framework | Spring Boot 3.3.x + Spring Security 6 |
| Frontend framework | Angular 20 (standalone components, signals) |
| Auth state (FE) | Angular `AuthService` with `signal()` + `localStorage` |
| Forms (FE) | Angular Reactive Forms (typed `FormGroup<T>`) |
| ORM | Spring Data JPA (Hibernate 6.4) |
| Database | PostgreSQL 16 |
| Migrations | Flyway Core (SQL scripts, auto-run on startup) |
| Cache | Redis 7 via Spring Data Redis + Spring Cache (`@Cacheable`) |
| Auth mechanism | JWT HS512, `localStorage`, 8 h, BCrypt cost 10 |
| Styling | CSS custom properties + Angular component CSS (`ViewEncapsulation.Emulated`) |
| Error envelope | `{ error: { code, message, fields? } }` via `@RestControllerAdvice` |
| Backend testing | JUnit 5 + Spring Boot Test + Mockito + Testcontainers |
| Frontend testing | Jasmine + Karma (unit) + Cypress (e2e) |
| Build tool (BE) | Maven 3.9+ (via `mvnw` wrapper) |
| Build tool (FE) | Angular CLI 20 (`ng build`, `ng serve`) |
