# Quickstart & Validation Guide: Deals Pipeline

**Feature**: `003-deals-pipeline` | **Date**: 2026-06-16

**Prerequisites**: `001-auth` and `002-contacts` complete and running.

---

## Setup

Flyway migration V6 runs automatically on startup:
- V6: `deals` table (FK to `contacts` and `users`)

No additional setup needed.

---

## Validation Scenarios

### Scenario 1 — View Kanban Board (US1, SC-001)

1. Log in → navigate to `http://localhost:3000/deals`
2. **Expected**: 6 columns visible in order: Lead, Qualified, Proposal, Negotiation, Closed Won, Closed Lost
3. **Expected**: Each column header shows deal count and total value (e.g., "3 deals · $45,000")
4. With no deals: all columns show zero count and $0 value; board is still visible

### Scenario 2 — Create a Deal (US2)

1. Click "New Deal" → drawer opens (400 px right-slide)
2. Enter title "Acme Enterprise", value 15000, stage "Proposal"
3. Click Save → **Expected**: deal card appears in the Proposal column
4. **Expected**: column header updates to include the new deal in count and value

### Scenario 3 — Required Field Validation (US2)

1. Open New Deal drawer → leave title blank → click Save
2. **Expected**: inline error "Title is required"; drawer does not close

### Scenario 4 — Drag-and-Drop Stage Move (US3, SC-002)

1. Locate a deal card in any column
2. Drag it to a different column → release
3. **Expected**: card moves immediately (< 200 ms, no spinner)
4. **Expected**: both source and target column counts and values update instantly
5. **Expected**: server call fires in background (check DevTools Network tab)

### Scenario 5 — Optimistic Revert on Server Failure (US3, SC-005)

1. Simulate server error: temporarily set an invalid `JWT_SECRET` env var and restart the backend
2. Drag a card to a new column
3. **Expected**: card moves optimistically, then reverts to original column within 3 s
4. **Expected**: error toast appears ("Stage change failed" or similar)
5. Restore the backend to normal after this test

### Scenario 6 — Closed Lost Visual Muting (US1)

1. Move a deal card to "Closed Lost" column
2. **Expected**: card renders with reduced opacity (approximately 0.6) compared to cards in other columns

### Scenario 7 — Edit a Deal (US4)

1. Click a deal card → edit drawer opens with all fields pre-populated
2. Change the value to a new amount → click Save
3. **Expected**: card displays new value; column total recalculates

### Scenario 8 — Delete a Deal (US5, SC-004)

1. Open a deal → click Delete in the edit drawer
2. **Expected**: confirmation dialog appears
3. Click Cancel → **Expected**: deal unchanged
4. Click Delete → Confirm → **Expected**: card removed from board; column total updates

---

## API Smoke Tests

```powershell
$res = Invoke-RestMethod -Uri http://localhost:5000/api/auth/login -Method POST -ContentType "application/json" -Body '{"email":"admin@aicrm.local","password":"Admin1234!"}'
$token = $res.token

# Get board
Invoke-RestMethod -Uri http://localhost:5000/api/deals/board -Headers @{ Authorization = "Bearer $token" }

# Create deal
$deal = '{"title":"Test Deal","stage":"LEAD","value":10000}'
$d = Invoke-RestMethod -Uri http://localhost:5000/api/deals -Method POST -ContentType "application/json" -Headers @{ Authorization = "Bearer $token" } -Body $deal
$dealId = $d.id

# Move stage
Invoke-RestMethod -Uri "http://localhost:5000/api/deals/$dealId/stage" -Method PATCH -ContentType "application/json" -Headers @{ Authorization = "Bearer $token" } -Body '{"stage":"QUALIFIED"}'

# Delete
Invoke-RestMethod -Uri "http://localhost:5000/api/deals/$dealId" -Method DELETE -Headers @{ Authorization = "Bearer $token" }
```

---

## Sign-Off Checklist

- [ ] Kanban board renders 6 columns in correct stage order
- [ ] Card drag-to-new-column produces visual state change within 200 ms
- [ ] Optimistic revert fires on server error with error toast
- [ ] Closed Lost cards visually muted (opacity 0.6)
- [ ] Column totals (count + value) accurate after every CRUD operation
- [ ] Delete shows confirmation dialog 100% of the time
- [ ] `deals::board` Redis cache evicted after any deal mutation (verify with `redis-cli`)
- [ ] Deal deletion does NOT delete linked Activities or Tasks (verify manually)
