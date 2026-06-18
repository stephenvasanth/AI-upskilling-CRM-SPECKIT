---
name: "crm-run"
description: "Start the full AI-CRM dev stack via Docker Compose (PostgreSQL 16, Redis 7, Spring Boot backend on port 5000, Angular frontend on port 3000). All 4 services defined in the root docker-compose.yml."
argument-hint: "Optional: '--build' to rebuild images before starting. Default: start all services (image rebuild only if image is missing)."
user-invocable: true
disable-model-invocation: false
---

## User Input

```text
$ARGUMENTS
```

Start all AI-CRM services via `docker-compose up` from the repo root. Pass `--build` to rebuild Docker images (needed after source code changes).

## Stack Reference

- **Docker Compose**: root `docker-compose.yml` — all 4 services on `crm-network`
  - `postgres`    — PostgreSQL 16, port 5432
  - `redis`       — Redis 7, port 6379
  - `crm-service` — Spring Boot (multi-stage Docker build), port 5000; auto-runs Flyway on startup
  - `crm-ui`      — Angular (multi-stage Docker build → nginx), port 3000; nginx proxies `/api/` to `crm-service:5000`
- **Env vars**: read from `.env` at repo root (copy from `.env.example` if missing)

## Prerequisites

Check that the root `docker-compose.yml` exists before proceeding:

```powershell
if (-not (Test-Path "docker-compose.yml")) {
    Write-Error "docker-compose.yml not found at repo root. Run the 001-auth setup tasks (T006) first."
    exit 1
}
```

Check that `.env` exists:

```powershell
if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Write-Warning ".env not found. Copy .env.example → .env and fill in JWT_SECRET before starting."
    } else {
        Write-Warning ".env not found. Create it with: POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB, REDIS_URL, JWT_SECRET, FRONTEND_ORIGIN=http://localhost:3000, SERVER_PORT=5000"
    }
    exit 1
}
```

## Steps

### 1. Determine start mode

- No argument → `docker-compose up -d` (detached, use cached images)
- `--build` → `docker-compose up -d --build` (rebuild images first — required after source code changes)

### 2. Start all services

**Without rebuild** (default):

```powershell
docker-compose up -d
```

**With rebuild** (after source changes):

```powershell
docker-compose up -d --build
```

This single command starts all 4 services in dependency order: postgres + redis → crm-service → crm-ui.

### 3. Wait for services to be healthy

Poll until the backend is ready (Flyway migrations run on `crm-service` startup):

```powershell
$timeout = 120
$elapsed = 0
Write-Output "Waiting for crm-service to be ready..."
do {
    Start-Sleep -Seconds 4
    $elapsed += 4
    try {
        Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" -Method POST `
            -Body '{}' -ContentType "application/json" -TimeoutSec 2 -ErrorAction Stop
    } catch [System.Net.WebException] {
        if ($_.Exception.Response) { break }  # got any HTTP response = server is up
    } catch {}
} while ($elapsed -lt $timeout)

if ($elapsed -ge $timeout) {
    Write-Error "crm-service did not become ready within ${timeout}s. Run 'docker-compose logs crm-service' to debug."
    exit 1
}
Write-Output "crm-service ready at http://localhost:5000"
```

Then verify the frontend is serving:

```powershell
try {
    $fe = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -ErrorAction Stop
    Write-Output "crm-ui ready at http://localhost:3000"
} catch {
    Write-Warning "crm-ui may still be starting. Check 'docker-compose logs crm-ui'."
}
```

### 4. Report status

```
AI-CRM Stack
============
postgres     → localhost:5432   (PostgreSQL 16)
redis        → localhost:6379   (Redis 7)
crm-service  → http://localhost:5000  (Spring Boot; Flyway auto-migrated)
crm-ui       → http://localhost:3000  (Angular; nginx proxies /api/ to crm-service)

Open http://localhost:3000 in your browser.
```

## Stopping the stack

```powershell
docker-compose down
```

To also remove volumes (wipes the database):

```powershell
docker-compose down -v
```

## Troubleshooting

- **Port conflict on 5432/6379/5000/3000**: Another service is using that port. Run `netstat -ano | findstr :<port>` to identify, then stop the conflicting process or update `docker-compose.yml` port mappings.
- **`crm-service` exits immediately**: Run `docker-compose logs crm-service` — likely a missing `JWT_SECRET` env var or a Flyway migration error.
- **`crm-ui` shows 502 Bad Gateway**: `crm-service` is not up yet. Wait a moment and refresh; or check `docker-compose logs crm-service`.
- **Image not found / build fails**: Run `/crm-run --build` to rebuild from source. Ensure `crm-service/Dockerfile` and `crm-ui/Dockerfile` both exist (001-auth T003/T004).
- **Flyway migration error**: View logs with `docker-compose logs crm-service`. Ensure all SQL in `db/migration/` uses `CREATE TABLE IF NOT EXISTS`. Run `/crm-migrate` for detailed migration status.
- **JWT_SECRET not set**: Backend refuses to start. Add `JWT_SECRET=<any-long-random-string>` to your `.env` file.
- **Source changes not reflected**: Run `/crm-run --build` to rebuild the affected Docker image(s).
