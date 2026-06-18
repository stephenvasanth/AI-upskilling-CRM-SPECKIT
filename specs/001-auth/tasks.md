# Tasks: Authentication & User Management

**Input**: Design documents from `specs/001-auth/`

**Prerequisites**: spec.md ✅ · plan.md ✅ · data-model.md ✅ · contracts/auth.md ✅ · research.md ✅ · quickstart.md ✅

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize both sibling projects at repo root with all tooling, config, and Docker services.

- [X] T001 Create `crm-service/` Maven project with `pom.xml` (Spring Boot 3.3, Java 21, all dependencies from plan.md)
- [X] T002 [P] Create `crm-ui/` Angular 20 project via `ng new crm-ui --routing --style=css --strict`
- [X] T003 Create `crm-service/Dockerfile` (multi-stage: Maven build stage + Eclipse Temurin 21 JRE runtime stage; exposes port 5000)
- [X] T004 [P] Create `crm-ui/Dockerfile` (multi-stage: Node 20 + `ng build` stage + nginx:alpine serve stage; copies `dist/crm-ui/browser` to `/usr/share/nginx/html`; exposes port 80)
- [X] T005 [P] Create `crm-ui/nginx.conf` (Angular SPA: `try_files $uri $uri/ /index.html`; proxy `/api/` to `http://crm-service:5000`)
- [X] T006 Create root `docker-compose.yml` with all 4 services: `postgres` (PostgreSQL 16, port 5432), `redis` (Redis 7, port 6379), `crm-service` (Spring Boot, port 5000, depends on postgres+redis), `crm-ui` (nginx, port 3000, depends on crm-service); all on shared `crm-network` bridge network
- [X] T007 [P] Create root `.env.example` with `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `REDIS_URL`, `JWT_SECRET`, `FRONTEND_ORIGIN=http://localhost:3000`, `SERVER_PORT=5000`
- [X] T008 Create `crm-service/src/main/resources/application.yml` (base) and `application-dev.yml` (local overrides; reads `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `FRONTEND_ORIGIN` from environment)
- [X] T009 [P] Create `crm-service/rules.md` and `crm-ui/rules.md` with coding standards and conventions
- [X] T010 Create `crm-ui/src/styles/tokens.css` with all CSS custom properties from `docs/DESIGN.md` §3 (colours, typography, spacing, radii, shadows)
- [X] T011 [P] Create `crm-ui/src/styles/reset.css` with base CSS reset

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core backend infrastructure and Angular shell that ALL 7 modules depend on. No user story work begins until this phase is complete.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T012 Create `AiCrmApplication.java` Spring Boot entry point in `crm-service/src/main/java/com/aicrm/`
- [X] T013 Create `V1__create_users_table.sql` Flyway migration in `crm-service/src/main/resources/db/migration/` (idempotent, `CREATE TABLE IF NOT EXISTS`)
- [X] T014 [P] Create `R__seed_dev_admin.sql` repeatable Flyway migration in `crm-service/src/main/resources/db/migration/` (dev admin seed via DevDataInitializer.java)
- [X] T015 Create `User.java` JPA entity + `Role` + `Status` enums in `crm-service/src/main/java/com/aicrm/module/user/`
- [X] T016 Create `UserRepository.java` (JpaRepository with `findByEmail`, `existsByEmail`) in `crm-service/src/main/java/com/aicrm/module/user/`
- [X] T017 Create `ErrorCode.java` enum + `ApiException.java` + `ErrorResponse.java` DTO in `crm-service/src/main/java/com/aicrm/common/`
- [X] T018 Create `GlobalExceptionHandler.java` (`@RestControllerAdvice`, structured JSON errors for all error codes) in `crm-service/src/main/java/com/aicrm/common/exception/`
- [X] T019 [P] Create `JwtConfig.java` (`SecretKey` bean from `JWT_SECRET` env var) in `crm-service/src/main/java/com/aicrm/config/`
- [X] T020 Create `JwtService.java` (generate + validate HS512 JWT, 8-hour expiry, `sub` = userId, `role` claim) in `crm-service/src/main/java/com/aicrm/security/`
- [X] T021 [P] Create `UserPrincipal.java` (Authentication principal holding userId + role) in `crm-service/src/main/java/com/aicrm/security/`
- [X] T022 Create `JwtAuthenticationFilter.java` (`OncePerRequestFilter`: extract Bearer token → validate → set SecurityContext) in `crm-service/src/main/java/com/aicrm/security/`
- [X] T023 Create `SecurityConfig.java` (Spring Security filter chain, CORS from `FRONTEND_ORIGIN`, `permitAll` on `POST /api/auth/login`, JWT filter) in `crm-service/src/main/java/com/aicrm/config/`
- [X] T024 [P] Create `RedisConfig.java` (`RedisCacheManager`, TTL 24 h, Jackson serializer) in `crm-service/src/main/java/com/aicrm/config/`
- [X] T025 [P] Create `TestcontainersConfig.java` (shared PostgreSQL 16 + Redis 7 Testcontainers setup) in `crm-service/src/test/java/com/aicrm/config/`
- [X] T026 Create Angular app shell: `app.config.ts` (provideRouter, provideHttpClient with interceptors), `app.routes.ts` (lazy-loaded module routes), `app.component.ts` (root shell with sidebar + router-outlet) in `crm-ui/src/app/`
- [X] T027 [P] Create `auth.guard.ts` (`CanActivateFn` — redirects to `/login` if no token) in `crm-ui/src/app/core/guards/`
- [X] T028 [P] Create `admin.guard.ts` (`CanActivateFn` — redirects to `/dashboard` if not ADMIN role) in `crm-ui/src/app/core/guards/`
- [X] T029 Create `auth.interceptor.ts` (attaches `Authorization: Bearer <token>` header to all outgoing HTTP requests) in `crm-ui/src/app/core/interceptors/`
- [X] T030 Create `error.interceptor.ts` (catches 401/403 → calls `authService.clearAuth()` + navigates to `/login`) in `crm-ui/src/app/core/interceptors/`

**Checkpoint**: Foundation ready — `docker-compose up` starts all 4 services; `crm-service` compiles and DB migrates on startup; `crm-ui` shell loads with route guards active.

---

## Phase 3: User Story 1 — Sign In (Priority: P1) 🎯 MVP

**Goal**: Team members can log in with email + password, receive a JWT, and be redirected to the Dashboard. Invalid credentials show a generic error message.

**Independent Test**: Open `/login` → enter valid credentials → land on `/dashboard`. Enter wrong credentials → stay on `/login` with generic error. Clear localStorage → navigate to `/dashboard` → redirect to `/login`.

### Implementation for User Story 1

- [X] T031 [P] [US1] Create `UserDto.java`, `LoginRequest.java`, `LoginResponse.java` records in `crm-service/src/main/java/com/aicrm/module/auth/dto/`
- [X] T032 [US1] Create `UserService.java` (`getById` with `@Cacheable("users")`, `findByEmail`) in `crm-service/src/main/java/com/aicrm/module/user/`
- [X] T033 [US1] Create `AuthService.java` (`login`: BCrypt verify → generate JWT → return `LoginResponse`; generic `AUTH_FAILED` on any failure including inactive account) in `crm-service/src/main/java/com/aicrm/module/auth/`
- [X] T034 [US1] Create `AuthController.java` with `POST /api/auth/login` and `GET /api/auth/me` in `crm-service/src/main/java/com/aicrm/module/auth/`
- [X] T035 [US1] Create Angular `AuthService` (`login()`, `hydrateFromStorage()`, `currentUser` signal, `isAuthenticated` + `isAdmin` computed signals) in `crm-ui/src/app/core/services/auth.service.ts`
- [X] T036 [P] [US1] Create `ButtonComponent` in `crm-ui/src/app/shared/components/button/`
- [X] T037 [P] [US1] Create `InputComponent` (label + error state, design token styling) in `crm-ui/src/app/shared/components/input/`
- [X] T038 [US1] Create `LoginComponent` (reactive form, email + password fields, generic error display, calls `AuthService.login()`, redirects on success) in `crm-ui/src/app/modules/auth/login/`
- [X] T039 [US1] Create `auth.routes.ts` and register `/login` route (no auth guard) in `crm-ui/src/app/modules/auth/`

**Checkpoint**: Users can log in → JWT stored in localStorage → redirected to `/dashboard`. Invalid credentials show generic error. All guarded routes redirect to `/login`.

---

## Phase 4: User Story 2 — Sign Out (Priority: P1)

**Goal**: Signed-in users can log out, ending their session immediately. Protected pages are inaccessible after logout.

**Independent Test**: Sign in → click Logout in sidebar → redirect to `/login`. Navigate to `/dashboard` → redirect to `/login`. Simulate 401 response → automatic redirect to `/login`.

### Implementation for User Story 2

- [X] T040 [US2] Implement `AuthService.logout()` and `clearAuth()` in `crm-ui/src/app/core/services/auth.service.ts` (removes token from localStorage, resets `currentUser` signal to null, navigates to `/login`)
- [X] T041 [P] [US2] Create `SidebarComponent` (240px dark, nav links, logout button wired to `AuthService.logout()`) in `crm-ui/src/app/shared/components/sidebar/`
- [X] T042 [US2] Verify `error.interceptor.ts` (T030) calls `clearAuth()` on 401/403 responses and navigates to `/login`
- [X] T043 [US2] Update `app.component.ts` to render `SidebarComponent` only when `isAuthenticated()` is true

**Checkpoint**: Logout clears session and redirects to `/login`. Expired tokens and 401/403 errors trigger automatic redirect. Unauthenticated direct navigation to protected routes redirects to `/login`.

---

## Phase 5: User Story 3 — Update Own Profile (Priority: P2)

**Goal**: Signed-in users can update their display name and change their password from the Profile page.

**Independent Test**: Navigate to `/profile` → change display name → save → verify updated name appears in sidebar. Change password → log out → log back in with new password → success. Old password rejected after change.

### Implementation for User Story 3

- [X] T044 [P] [US3] Create `UpdateProfileRequest.java` and `ChangePasswordRequest.java` records in `crm-service/src/main/java/com/aicrm/module/auth/dto/`
- [X] T045 [US3] Add `updateProfile()` (with `@CacheEvict("users")`) and `changePassword()` methods to `AuthService.java` in `crm-service/src/main/java/com/aicrm/module/auth/`
- [X] T046 [US3] Add `PUT /api/auth/profile` and `PUT /api/auth/password` endpoints to `AuthController.java` in `crm-service/src/main/java/com/aicrm/module/auth/`
- [X] T047 [P] [US3] Create `ToastService` + `ToastComponent` (top-right, max 3 visible, 4s auto-dismiss, `prefers-reduced-motion` respected) in `crm-ui/src/app/shared/components/toast/`
- [X] T048 [US3] Create `ProfileComponent` (display name form + change password form, inline validation, toast on success/error, calls `AuthService` update methods) in `crm-ui/src/app/modules/auth/profile/`
- [X] T049 [US3] Register `/profile` route (protected by `authGuard`) in `crm-ui/src/app/modules/auth/auth.routes.ts`
- [X] T050 [US3] Update `SidebarComponent` (T041) to display `currentUser().displayName` dynamically and link to `/profile`

**Checkpoint**: Display name update reflected in sidebar on save. Password change causes old password to be rejected on next login attempt.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T051 [P] Create `AvatarComponent` (initials-based, coloured by role/user) in `crm-ui/src/app/shared/components/avatar/`
- [X] T052 [P] Create `BadgeComponent` (roles, status, tags display) in `crm-ui/src/app/shared/components/badge/`
- [X] T053 [P] Create `ModalComponent` (confirm dialog, used by downstream modules) in `crm-ui/src/app/shared/components/modal/`
- [X] T054 [P] Create `DrawerComponent` (right-slide 400px, `prefers-reduced-motion` respected) in `crm-ui/src/app/shared/components/drawer/`
- [X] T055 [P] Create `EmptyStateComponent` in `crm-ui/src/app/shared/components/empty-state/`
- [X] T056 [P] Create `SkeletonComponent` (shimmer loader) in `crm-ui/src/app/shared/components/skeleton/`
- [x] T057 Verify Angular initial bundle < 500 KB gzipped via `ng build --stats-json` in `crm-ui/`
- [X] T058 [P] Write `AuthServiceTest.java` (Mockito unit tests: login success, wrong password, inactive user, updateProfile, changePassword) in `crm-service/src/test/java/com/aicrm/auth/`
- [X] T059 [P] Write `AuthControllerTest.java` (`@SpringBootTest` slice — all 4 endpoints, all error codes) in `crm-service/src/test/java/com/aicrm/auth/`
- [x] T060 Run quickstart.md validation scenarios end-to-end

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — BLOCKS all user stories
- **Phase 3 (US1 Sign In)**: Depends on Phase 2
- **Phase 4 (US2 Sign Out)**: Depends on Phase 3 (requires Angular `AuthService` + `LoginComponent`)
- **Phase 5 (US3 Profile)**: Backend independent of Phase 3/4; frontend requires `AuthService` from Phase 3
- **Phase 6 (Polish)**: Depends on Phases 3–5

### User Story Dependencies

- **US1 (Sign In)**: Can start after Phase 2 — no cross-story dependency
- **US2 (Sign Out)**: Requires Angular `AuthService` (US1); logout logic extends US1's `AuthService`
- **US3 (Update Profile)**: Backend fully independent; frontend requires `AuthService` signal from US1

### Parallel Opportunities

- T001 + T002: Backend and frontend project init simultaneously
- T003 + T004 + T005: All Dockerfile and nginx config (different files)
- T012–T025: All backend foundation tasks (separate files/packages) in parallel
- T026–T030: Angular shell + interceptors + guards in parallel
- T031 + T036 + T037: Backend DTOs + frontend components simultaneously
- T044 + T047: Profile DTOs + ToastComponent (no dependencies)
- T051–T056: All shared components (different files)
- T058 + T059: Both test classes simultaneously

---

## Parallel Example: User Story 1

```bash
# Parallel group — no interdependencies:
Task T031: Create UserDto, LoginRequest, LoginResponse in crm-service/.../auth/dto/
Task T036: Create ButtonComponent in crm-ui/.../shared/components/button/
Task T037: Create InputComponent in crm-ui/.../shared/components/input/

# Sequential: Backend chain
Task T032: UserService (depends on T016 UserRepository)
Task T033: AuthService (depends on T032 + T020 JwtService)
Task T034: AuthController (depends on T033 + T031 DTOs)

# Sequential: Frontend chain
Task T035: Angular AuthService (depends on T029 interceptor registered in app.config)
Task T038: LoginComponent (depends on T035 AuthService + T036 Button + T037 Input)
Task T039: auth.routes.ts (depends on T038 LoginComponent)
```

---

## Implementation Strategy

### MVP First (US1 Sign In only)

1. Complete Phase 1: Setup (including `docker-compose up` to verify all 4 services start)
2. Complete Phase 2: Foundational — CRITICAL, blocks everything
3. Complete Phase 3: US1 Sign In
4. **STOP and VALIDATE**: Login works end-to-end; JWT stored; Dashboard reachable; protected routes guard correctly
5. Continue to Phase 4 (US2), then Phase 5 (US3)

### Incremental Delivery

1. Setup + Foundational → `docker-compose up` brings up all services; DB migrates on first boot
2. US1 → Login works end-to-end → validate independently
3. US2 → Logout + auto-redirect on session expiry → validate independently
4. US3 → Profile management → validate independently
5. Polish → shared components, tests, bundle size check

---

## Notes

- `[P]` tasks work on different files with no incomplete dependencies — safe to run concurrently
- `[USn]` label maps each task to its user story for traceability
- **Docker Compose** (T006): root `docker-compose.yml` runs all 4 services — postgres, redis, crm-service, crm-ui. Use `/crm-run` skill to start.
- Phase 2 is large because 001-auth establishes the ENTIRE project skeleton and shared infrastructure for all 7 modules
- Shared components T051–T056 are needed by downstream modules (002–007); complete before those modules begin implementation
- `R__seed_dev_admin.sql` is a Flyway repeatable migration — dev-profile only, not run in production
- No server-side logout endpoint: token removal is client-side only (constitution §II, no token blacklist)
- **DevDataInitializer.java** seeds `admin@aicrm.local / Admin1234!` using `BCryptPasswordEncoder` (dev profile only); avoids hardcoding BCrypt hash in SQL
