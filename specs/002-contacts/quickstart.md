# Quickstart & Validation Guide: Contact Management

**Feature**: `002-contacts` | **Date**: 2026-06-16

**Prerequisites**: `001-auth` module complete and running.
Infrastructure (PostgreSQL + Redis via Docker Compose) already started.

---

## Setup

Flyway migrations V2–V5 run automatically when `crm-service` starts:
- V2: `companies` table
- V3: `contacts` table (FK to `companies` and `users`)
- V4: `tags` table
- V5: `contact_tags` join table

No additional setup needed — the seed script also inserts a few sample companies
for the picker.

---

## Validation Scenarios

### Scenario 1 — Create a Contact (US1, SC-001)

1. Log in → navigate to `http://localhost:3000/contacts`
2. Click "New Contact" → fill in First Name: `Jane`, Last Name: `Smith`, Email: `jane@acme.com`
3. Select a company from the picker → assign owner → click Save
4. **Expected**: Redirect to Contact detail page; all entered values visible
5. Navigate to `/contacts` → **Expected**: Jane Smith appears in the list

### Scenario 2 — Required Field Validation (US1)

1. Open New Contact form → leave First Name blank → click Save
2. **Expected**: Inline error "First name is required"; form does not submit
3. Fill First Name, leave Last Name blank → **Expected**: same behaviour for Last Name

### Scenario 3 — Email Format Validation (US1)

1. Enter email `notanemail` → click Save
2. **Expected**: Inline error "Must be a valid email address"; form does not submit

### Scenario 4 — Search Contacts (US2, SC-002, NFR-P01)

1. With 5+ contacts in the system, type part of a name in the search bar
2. **Expected**: List updates within 300 ms (debounced); only matching contacts show
3. Clear search → type an email address → **Expected**: matching contact shows
4. Search for a term with no match → **Expected**: empty state "No contacts match your search"

### Scenario 5 — Tag Filter (US2)

1. Ensure at least one Tag exists (create via Admin if needed)
2. Assign the tag to a contact
3. Select the tag in the filter dropdown → **Expected**: only tagged contacts show
4. Apply both a search term and the tag filter → **Expected**: intersection shown

### Scenario 6 — Contact Detail Page (US3)

1. Click any contact → verify 2-column layout: left 3/5 info, right 2/5 activity feed
2. Verify all fields (name, email, phone, job title, company, owner, tags) are displayed
3. Verify the activity feed section exists (may be empty)
4. Verify a "Linked Deals" section exists

### Scenario 7 — Edit Contact (US4)

1. Open a contact → click Edit → change the phone number
2. Click Save → **Expected**: detail page shows new phone number; list view updated

### Scenario 8 — Delete Contact Cascade (US5, SC-003, SC-004)

1. Create a contact; log 2 activities against them; create 1 task linked to them
2. Click Delete → **Expected**: confirmation dialog appears
3. Click Cancel → **Expected**: contact unchanged
4. Click Delete → Confirm → **Expected**: contact gone from list
5. Navigate to Activities global page → **Expected**: the 2 activities no longer appear
6. Navigate to Tasks → **Expected**: the task still exists; contact name is blank/cleared

---

## API Smoke Tests

```powershell
# Get token first
$body = '{"email":"admin@aicrm.local","password":"Admin1234!"}'
$res = Invoke-RestMethod -Uri http://localhost:5000/api/auth/login -Method POST -ContentType "application/json" -Body $body
$token = $res.token

# List contacts
Invoke-RestMethod -Uri "http://localhost:5000/api/contacts" -Headers @{ Authorization = "Bearer $token" }

# Create contact
$contact = '{"firstName":"Test","lastName":"Contact","email":"test@example.com"}'
$created = Invoke-RestMethod -Uri http://localhost:5000/api/contacts -Method POST -ContentType "application/json" -Headers @{ Authorization = "Bearer $token" } -Body $contact
$contactId = $created.id

# Search
Invoke-RestMethod -Uri "http://localhost:5000/api/contacts?search=Test" -Headers @{ Authorization = "Bearer $token" }

# Delete
Invoke-RestMethod -Uri "http://localhost:5000/api/contacts/$contactId" -Method DELETE -Headers @{ Authorization = "Bearer $token" }

# Companies lookup
Invoke-RestMethod -Uri http://localhost:5000/api/companies -Headers @{ Authorization = "Bearer $token" }
```

---

## Sign-Off Checklist

- [ ] All 8 validation scenarios pass manually
- [ ] Search results appear within 300 ms (check browser DevTools Network timing)
- [ ] Contact detail 2-column layout renders correctly at 1280 px and 1440 px
- [ ] Delete shows confirmation dialog 100% of the time
- [ ] Deleted contact's activities are gone; tasks are preserved with cleared contact ref
- [ ] Redis cache key `contacts::list::*` evicted after create/update/delete (verify with `redis-cli`)
- [ ] Pagination shows 20 per page; navigate to page 2 with 21+ contacts
- [ ] Company picker populates from `GET /api/companies`
