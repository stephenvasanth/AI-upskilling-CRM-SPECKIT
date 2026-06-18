---
name: "crm-migrate"
description: "Check and report Flyway migration state for the AI-CRM database. Shows applied/pending migrations without running the full Spring Boot app."
argument-hint: "Optional: 'info' (status only, default), 'validate' (check checksums), 'repair' (fix broken checksums)"
user-invocable: true
disable-model-invocation: false
---

## User Input

```text
$ARGUMENTS
```

## Stack Reference

- **Flyway**: Managed by Spring Boot (`spring.flyway.*` in `application.yml`); auto-runs on startup
- **Migration files**: `crm-service/src/main/resources/db/migration/`
- **Versioned**: `V{n}__{description}.sql` — run once in order
- **Repeatable**: `R__{description}.sql` — re-run when checksum changes (dev seeds only)
- **Expected migrations**: V1 (users) · V2 (companies) · V3 (contacts) · V4 (tags) · V5 (contact_tags) · V6 (deals) · V7 (activities) · V8 (tasks)
- **Repeatable**: R__seed_dev_admin.sql (dev profile only)
- **Database**: PostgreSQL 16 via Docker Compose (must be running)

## Steps

### 1. Ensure Docker services are running

```powershell
cd crm-service
$pgStatus = docker-compose ps postgres 2>&1
if ($pgStatus -notmatch "Up") {
    Write-Output "PostgreSQL not running. Starting Docker services..."
    docker-compose up -d
    Start-Sleep -Seconds 5
}
```

### 2. Determine operation

- No argument or `info` → show migration status (applied + pending)
- `validate` → check all applied migration checksums match current files
- `repair` → repair the Flyway schema history table (fixes checksum mismatches from file edits)

### 3. Run Flyway via Maven plugin

**Info (default)**:
```powershell
cd crm-service
mvn flyway:info -Dflyway.url="jdbc:postgresql://localhost:5432/aicrm" `
    -Dflyway.user="postgres" -Dflyway.password="postgres" `
    -Dflyway.locations="filesystem:src/main/resources/db/migration"
```

**Validate**:
```powershell
cd crm-service
mvn flyway:validate -Dflyway.url="jdbc:postgresql://localhost:5432/aicrm" `
    -Dflyway.user="postgres" -Dflyway.password="postgres" `
    -Dflyway.locations="filesystem:src/main/resources/db/migration"
```

**Repair** (use only when checksums are broken, e.g. after editing an already-applied migration file):
```powershell
cd crm-service
mvn flyway:repair -Dflyway.url="jdbc:postgresql://localhost:5432/aicrm" `
    -Dflyway.user="postgres" -Dflyway.password="postgres" `
    -Dflyway.locations="filesystem:src/main/resources/db/migration"
```

> Note: actual DB credentials come from `crm-service/.env` or `application-dev.yml`. Read those files first and substitute the real values.

### 4. Read actual DB credentials

Before running Flyway commands, read the real credentials:

```powershell
# Check .env file first
if (Test-Path "crm-service/.env") {
    Get-Content "crm-service/.env" | ForEach-Object {
        if ($_ -match "^DATABASE_URL=(.+)") { $dbUrl = $matches[1] }
    }
}
# Fall back to application-dev.yml defaults
```

### 5. Report migration status

Parse the Flyway info output and report:

```
Flyway Migration Status
=======================
Database: jdbc:postgresql://localhost:5432/aicrm

Version  | Description              | Status    | Applied At
---------|--------------------------|-----------|-------------------
1        | create users table       | Success   | 2026-06-16 10:00
2        | create companies table   | Success   | 2026-06-16 10:00
3        | create contacts table    | Success   | 2026-06-16 10:00
4        | create tags table        | Pending   | —
5        | create contact tags table| Pending   | —
...

Applied:  3 migrations
Pending:  5 migrations
```

Highlight any **Out of Order** or **Failed** migrations in red.

## Expected migration sequence

| Version | File | Module |
|---------|------|--------|
| V1 | `V1__create_users_table.sql` | 001-auth |
| V2 | `V2__create_companies_table.sql` | 002-contacts |
| V3 | `V3__create_contacts_table.sql` | 002-contacts |
| V4 | `V4__create_tags_table.sql` | 002-contacts |
| V5 | `V5__create_contact_tags_table.sql` | 002-contacts |
| V6 | `V6__create_deals_table.sql` | 003-deals-pipeline |
| V7 | `V7__create_activities_table.sql` | 004-activities |
| V8 | `V8__create_tasks_table.sql` | 005-tasks |
| R__ | `R__seed_dev_admin.sql` | 001-auth (dev only) |

## Troubleshooting

- **`flyway:info` hangs**: PostgreSQL may not be ready. Run `/crm-run docker` first.
- **Checksum mismatch**: You edited a migration file after it was applied. Run `crm-migrate repair` to fix, but only if the edit was intentional and safe (the DB already has the old schema).
- **Migration not found**: Verify the file is in `db/migration/` with the correct naming convention (`V{n}__description.sql`, double underscore).
- **Failed migration**: A SQL error occurred mid-migration. The `flyway_schema_history` table will have a `FAILED` row. Fix the SQL, then run `repair` before restarting Spring Boot.
- **`spring.flyway.baseline-on-migrate=true`**: Set in `application.yml` to handle the first run safely on an existing database.
