# Quickstart & Validation Guide: Activity Logging

**Feature**: `004-activities` | **Date**: 2026-06-16

**Prerequisites**: `001-auth`, `002-contacts`, `003-deals-pipeline` complete and running.

---

## Setup

Flyway migration V7 runs automatically on startup:
- V7: `activities` table (FK to `users`, `contacts`, `deals`)

---

## Validation Scenarios

### Scenario 1 — Log Activity from Contact Detail (US1, SC-001)

1. Log in → open any Contact detail page
2. Click "Log Activity" → drawer opens (400 px, right-slide)
3. Select type "Call", enter subject "Discovery call", add notes
4. Click Save → **Expected**: drawer closes; new activity appears at the TOP of the feed
5. **Expected**: activity shows type icon, subject, author name, and timestamp

### Scenario 2 — Required Field Validation (US1)

1. Open Log Activity drawer → leave subject blank → click Save
2. **Expected**: inline error "Subject is required"; drawer does not close

### Scenario 3 — Author Set Server-Side (US1)

1. Log an activity → view it in the feed
2. **Expected**: author shown is the currently logged-in user (set by server from JWT)
3. Verify no `authorId` field is sent in the POST request body (DevTools Network tab)

### Scenario 4 — Activity Feed Order (US2, SC-005)

1. Log 3 activities on the same contact at different times
2. Open the Contact detail page
3. **Expected**: activities appear in reverse-chronological order (most recent at top)

### Scenario 5 — Empty State (US2)

1. Create a new Contact with no activities
2. Open their detail page → view activity feed
3. **Expected**: empty state message + "Log Activity" call-to-action visible

### Scenario 6 — Global Activity Feed (US3, SC-002)

1. Navigate to `http://localhost:3000/activities`
2. **Expected**: all activities across all contacts/deals, most recent first, paginated (20 per page)
3. Apply type filter "Email" → **Expected**: only Email activities shown
4. Apply date range filter → **Expected**: only activities within range shown
5. Clear filters → **Expected**: full feed restored

### Scenario 7 — Delete Activity (US4, SC-004)

1. Find an activity in a feed → hover to reveal delete button
2. Click Delete → **Expected**: confirmation dialog
3. Cancel → **Expected**: activity unchanged
4. Delete → Confirm → **Expected**: activity gone from contact feed, deal feed, and global feed

### Scenario 8 — Log Activity Against a Deal

1. Open a Deal (via edit drawer) → navigate to its activity feed section
2. Log an activity linked to the deal
3. **Expected**: activity appears in the deal's activity feed

---

## API Smoke Tests

```powershell
$res = Invoke-RestMethod -Uri http://localhost:5000/api/auth/login -Method POST -ContentType "application/json" -Body '{"email":"admin@aicrm.local","password":"Admin1234!"}'
$token = $res.token

# Log an activity
$act = '{"type":"NOTE","subject":"First note","notes":"Test content","contactId":null}'
$a = Invoke-RestMethod -Uri http://localhost:5000/api/activities -Method POST -ContentType "application/json" -Headers @{ Authorization = "Bearer $token" } -Body $act
$actId = $a.id

# Global feed
Invoke-RestMethod -Uri "http://localhost:5000/api/activities?page=0" -Headers @{ Authorization = "Bearer $token" }

# Filter by type
Invoke-RestMethod -Uri "http://localhost:5000/api/activities?type=NOTE" -Headers @{ Authorization = "Bearer $token" }

# Delete
Invoke-RestMethod -Uri "http://localhost:5000/api/activities/$actId" -Method DELETE -Headers @{ Authorization = "Bearer $token" }
```

---

## Sign-Off Checklist

- [ ] New activity appears at top of contact feed within 1 second of save
- [ ] Author is always the logged-in user; no client-supplied author accepted
- [ ] Activity feed is reverse-chronological; verified with 3+ activities
- [ ] Global feed filters (type, date range) update within 500 ms
- [ ] Delete shows confirmation dialog; deleted activity disappears from all feeds
- [ ] Empty state shown when contact has no activities
- [ ] `activities::contact::{id}::*` Redis keys evicted after log/delete
- [ ] `ON DELETE CASCADE`: deleting a Contact removes their linked Activities
