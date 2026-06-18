# Quickstart & Validation Guide: Authentication & User Management

**Feature**: `001-auth` | **Date**: 2026-06-16

This guide describes how to get the auth module running locally and validate
that all user stories work end-to-end. It is a **validation guide**, not an
implementation guide — no complete implementation code is included here.

---

## Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| JDK 21 | 21 LTS | `JAVA_HOME` already set; verify: `$env:JAVA_HOME` in PowerShell |
| Maven | 3.9+ | Use the `mvnw` wrapper in `crm-service/` — no separate install needed |
| Node.js | 20 LTS | `node --version` |
| Angular CLI | 20 | `npm i -g @angular/cli@20`; dev server runs on port 3000 |
| Docker Desktop | Latest | For PostgreSQL 16 + Redis 7 via Docker Compose |

---

## Local Setup

### 1. Start infrastructure

```powershell
# From crm-service/ directory
docker-compose up -d
# Starts:
#   PostgreSQL 16 on localhost:5432  (db: aicrm, user: postgres, pass: postgres)
#   Redis 7 on localhost:6379
```

### 2. Configure backend environment

```powershell
# In crm-service/
copy .env.example .env
# Edit .env and fill in:
#   SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/aicrm
#   SPRING_DATASOURCE_USERNAME=postgres
#   SPRING_DATASOURCE_PASSWORD=postgres
#   SPRING_DATA_REDIS_HOST=localhost
#   SPRING_DATA_REDIS_PORT=6379
#   JWT_SECRET=<minimum 64-character random string>
#   FRONTEND_ORIGIN=http://localhost:3000
#   SERVER_PORT=5000
```

### 3. Start the backend (Spring Boot)

```powershell
# In crm-service/
.\mvnw spring-boot:run
# Flyway migrations run automatically on startup
# Server starts on http://localhost:5000
# Look for: "Started AiCrmApplication in X.Xs"
```

> On first run, Flyway executes `V1__create_users_table.sql` and
> `R__seed_dev_admin.sql` (dev profile only), creating the `users` table and
> seeding `admin@aicrm.local`.

### 4. Start the frontend (Angular)

```powershell
# In crm-ui/
npm install
ng serve --port 3000
# Dev server starts on http://localhost:3000
# Hot-reload enabled; changes reflect immediately
```

---

## Validation Scenarios

### Scenario 1 — Successful Login (User Story 1, SC-001)

1. Open `http://localhost:3000` in a desktop browser (min 1280 px wide)
2. Verify you are redirected to `/login` (no token in localStorage)
3. Enter `admin@aicrm.local` / `Admin1234!` → click Sign In
4. **Expected**: Redirect to `/dashboard`; sidebar shows "CRM Admin" + "ADMIN" role badge
5. **Verify**: Open DevTools → Application → Local Storage → confirm `token` key is present

### Scenario 2 — Failed Login (User Story 1, SC-003)

1. Navigate to `/login`
2. Enter any email + wrong password → click Sign In
3. **Expected**: Generic error message shown below the form ("Invalid email or password")
4. Repeat with a valid email but wrong password → confirm **same** error message text
5. Repeat with a non-existent email → confirm **same** error message (no enumeration hint)

### Scenario 3 — Session Expiry (SC-002, AUTH-02)

1. Log in successfully
2. Open DevTools → Application → Local Storage
3. Replace the `token` value with an expired JWT (or modify `exp` claim)
4. Navigate to any page (e.g., `/dashboard`)
5. **Expected**: Redirected to `/login`; token is cleared from localStorage
6. **Or**: Wait 8 hours with an active session → next API call triggers the same redirect

### Scenario 4 — Logout (User Story 2)

1. Log in as any user
2. Click the Logout link in the sidebar bottom section
3. **Expected**: Redirect to `/login`; `token` is removed from localStorage
4. Manually type `http://localhost:3000/dashboard` in the address bar
5. **Expected**: Redirected back to `/login` (authGuard fires)

### Scenario 5 — Protected Route Enforcement (SC-001)

1. Ensure you are **not** logged in (clear localStorage if needed)
2. Navigate directly to `http://localhost:3000/contacts`
3. **Expected**: Redirected to `/login`
4. Repeat for `/deals`, `/tasks`, `/activities`, `/admin`
5. **Expected**: All redirect to `/login`

### Scenario 6 — Update Display Name (User Story 3, SC-005)

1. Log in → navigate to `/profile`
2. Change the display name field to a new value → click Save
3. **Expected**: Success toast appears top-right (4 s auto-dismiss)
4. **Expected**: Sidebar immediately shows the new name (Angular signal update)
5. Refresh the page → **Expected**: New name persists (fetched from server/cache)

### Scenario 7 — Change Password (User Story 3, SC-004)

1. Log in → navigate to `/profile`
2. Enter current password + a new password (8+ chars) → click Save
3. **Expected**: Success toast; stay on profile page
4. Click Logout → try to log in with the **old** password
5. **Expected**: `AUTH_FAILED` error, stay on login page
6. Log in with the **new** password → **Expected**: Success, redirect to `/dashboard`

### Scenario 8 — Password Validation (AUTH-08)

1. Navigate to `/profile` → attempt to set a new password of 7 characters
2. **Expected**: Inline validation error appears below the password field
3. **Expected**: The form does not submit (Angular Reactive Forms validation fires)
4. **Expected**: No network request is made (check DevTools Network tab)

---

## API Smoke Tests

Run these from PowerShell with `Invoke-RestMethod` or any REST client (Insomnia, Bruno, curl):

```powershell
# ── Login ────────────────────────────────────────────────────────────────────
$body = '{"email":"admin@aicrm.local","password":"Admin1234!"}'
$response = Invoke-RestMethod -Uri http://localhost:5000/api/auth/login `
  -Method POST -ContentType "application/json" -Body $body
$token = $response.token
# Expected: 200 { token: "eyJ...", user: { id, email, displayName, role } }

# ── Wrong credentials ─────────────────────────────────────────────────────────
Invoke-RestMethod -Uri http://localhost:5000/api/auth/login `
  -Method POST -ContentType "application/json" `
  -Body '{"email":"admin@aicrm.local","password":"wrongpass"}'
# Expected: 401 { error: { code: "AUTH_FAILED", message: "Invalid email or password" } }

# ── Get own profile (authenticated) ──────────────────────────────────────────
Invoke-RestMethod -Uri http://localhost:5000/api/auth/me `
  -Headers @{ Authorization = "Bearer $token" }
# Expected: 200 { id, email, displayName, role, status, createdAt }

# ── No token ─────────────────────────────────────────────────────────────────
Invoke-RestMethod -Uri http://localhost:5000/api/auth/me
# Expected: 401 { error: { code: "UNAUTHORIZED", message: "Authentication required" } }

# ── Update profile ────────────────────────────────────────────────────────────
Invoke-RestMethod -Uri http://localhost:5000/api/auth/profile `
  -Method PUT -ContentType "application/json" `
  -Headers @{ Authorization = "Bearer $token" } `
  -Body '{"displayName":"Super Admin"}'
# Expected: 200 { id, email, displayName: "Super Admin", role }

# ── Change password ───────────────────────────────────────────────────────────
Invoke-RestMethod -Uri http://localhost:5000/api/auth/password `
  -Method PUT -ContentType "application/json" `
  -Headers @{ Authorization = "Bearer $token" } `
  -Body '{"currentPassword":"Admin1234!","newPassword":"NewPass789!"}'
# Expected: 200 { message: "Password updated successfully" }
```

---

## Checklist — Auth Module Sign-Off

Before marking `001-auth` complete and moving to `002-contacts`:

- [ ] All 8 validation scenarios above pass manually
- [ ] API smoke tests return expected status codes and shapes
- [ ] Error messages for wrong-email and wrong-password are **identical** (SC-003)
- [ ] localStorage is cleared on logout and on 401 intercept (check DevTools)
- [ ] `/profile` name update reflects in sidebar within one Angular change detection cycle
- [ ] Password change rejects old password immediately on next login (SC-004)
- [ ] No raw passwords or JWT tokens appear in Spring Boot server logs
- [ ] `mvnw spring-boot:run` runs Flyway migrations without errors on a fresh database
- [ ] Angular frontend bundle size confirmed < 500 KB gzipped (`ng build --stats-json`)
- [ ] Redis cache is populated after first `GET /api/auth/me` (verify with `redis-cli get "users::{id}"`)
- [ ] Redis cache is invalidated after `PUT /api/auth/profile` (key no longer exists in Redis)
- [ ] ADMIN-only routes return 403 when accessed with a USER role token
