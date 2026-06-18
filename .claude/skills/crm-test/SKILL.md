---
name: "crm-test"
description: "Run tests for the AI-CRM project. Backend: JUnit 5 + Testcontainers (self-contained, no running DB needed). Frontend: Jasmine + Karma headless."
argument-hint: "Optional: 'be' (backend only), 'fe' (frontend only). Default: both."
user-invocable: true
disable-model-invocation: false
---

## User Input

```text
$ARGUMENTS
```

Run the appropriate test suite based on the argument. With no argument, run both.

## Stack Reference

- **Backend tests**: `crm-service/` — `mvn test` — JUnit 5 + Spring Boot Test + Mockito + Testcontainers (spins up its own PostgreSQL + Redis containers; does NOT require `docker-compose up`)
- **Frontend tests**: `crm-ui/` — `ng test --watch=false --browsers=ChromeHeadless` — Jasmine + Karma
- **E2E tests**: `crm-ui/` — `npx cypress run` — Cypress (requires full stack running; use `/crm-run` first)

## Steps

### 1. Determine which tests to run

- No argument or `all` → run backend then frontend
- `be` → backend tests only
- `fe` → frontend unit tests only
- `e2e` → Cypress e2e tests (note: requires full stack running via `/crm-run`)

### 2. Run backend tests (skip if argument is `fe` or `e2e`)

```powershell
cd crm-service

# Verify project exists
if (-not (Test-Path "pom.xml")) {
    Write-Error "crm-service/pom.xml not found. Run 001-auth setup tasks first."
    exit 1
}

# Run all tests (Testcontainers handles PG + Redis automatically)
mvn test
```

Report results:
- **PASS**: Output "Backend tests PASSED — {n} tests, 0 failures"
- **FAIL**: Show the failing test names and assertion messages from the Maven Surefire output
- **ERROR**: Show the full stack trace for any unexpected exceptions

Key test locations:
- `src/test/java/com/aicrm/auth/` — Auth module tests
- `src/test/java/com/aicrm/contact/` — Contact tests
- `src/test/java/com/aicrm/deal/` — Deal tests
- `src/test/java/com/aicrm/activity/` — Activity tests
- `src/test/java/com/aicrm/task/` — Task tests
- `src/test/java/com/aicrm/dashboard/` — Dashboard tests
- `src/test/java/com/aicrm/admin/` — Admin tests
- `src/test/java/com/aicrm/config/TestcontainersConfig.java` — Shared containers

### 3. Run frontend tests (skip if argument is `be` or `e2e`)

```powershell
cd crm-ui

# Verify project exists
if (-not (Test-Path "package.json")) {
    Write-Error "crm-ui/package.json not found. Run 001-auth setup tasks first."
    exit 1
}

# Install dependencies if needed
if (-not (Test-Path "node_modules")) {
    npm install
}

# Run Karma in headless mode (single run, no watch)
ng test --watch=false --browsers=ChromeHeadless
```

Report results:
- **PASS**: Output "Frontend tests PASSED — {n} specs, 0 failures"
- **FAIL**: Show the failing spec descriptions and expected vs. actual values

### 4. Run e2e tests (only if argument is `e2e`)

Prerequisite check — full stack must be running:

```powershell
# Check backend is reachable
try {
    Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" -Method POST -TimeoutSec 3 -ErrorAction Stop
} catch [System.Net.WebException] {
    if (-not $_.Exception.Response) {
        Write-Error "Backend not running. Run '/crm-run' first."
        exit 1
    }
}

# Check frontend is reachable
try {
    Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 3 -ErrorAction Stop
} catch {
    Write-Error "Frontend not running. Run '/crm-run' first."
    exit 1
}

cd crm-ui
npx cypress run
```

### 5. Summary report

After all suites complete, output a summary:

```
Test Results
============
Backend  (JUnit):  PASSED  — X tests
Frontend (Karma):  PASSED  — X specs
E2E      (Cypress): SKIPPED (not requested)

Overall: ALL PASSED ✓
```

If any suite fails, list the failing tests and suggest next steps.

## Tips

- **Testcontainers requires Docker**: `docker` daemon must be running for `mvn test`. Run `docker info` to verify.
- **ChromeHeadless not found**: Install Chrome or run `ng test --browsers=ChromeHeadlessNoSandbox` in CI.
- **Run a single test class**: `mvn test -Dtest=AuthServiceTest` in `crm-service/`.
- **Run a single spec file**: `ng test --include="**/auth.service.spec.ts"` in `crm-ui/`.
- **Verbose Maven output**: Add `-X` flag to `mvn test` for debug-level logging.
