# Quickstart & Validation Guide: Admin — User & Tag Management

**Feature**: `007-admin` | **Date**: 2026-06-16

**Prerequisites**: `001-auth` complete and running. Default admin account
(`admin@aicrm.local` / `Admin1234!`) seeded. Modules 002+ running for Tag
assignment validation.

---

## Setup

No new migrations. Users table from V1 (001-auth), Tags from V4, ContactTags from V5 (both in 002-contacts).

---

## Validation Scenarios

### Scenario 1 — Create a New User (US1, SC-001)

1. Log in as `admin@aicrm.local` → navigate to `http://localhost:3000/admin/users`
2. Click "Invite User" → drawer opens
3. Enter: Name `Test User`, Email `testuser@aicrm.local`, Password `Welcome123!`, Role `USER`
4. Click Save → **Expected**: new user appears in the Users table with "Active" status
5. Log out → log in as `testuser@aicrm.local` / `Welcome123!`
6. **Expected**: successful login; lands on Dashboard
7. **Expected**: Users and Tags menu items NOT visible in sidebar

### Scenario 2 — Duplicate Email Blocked (US1)

1. Log in as admin → create a user with email `testuser@aicrm.local` (already exists)
2. Click Save → **Expected**: inline error "Email address already in use"; no duplicate created

### Scenario 3 — Change User Role (US2, SC-005)

1. Change `testuser@aicrm.local` from USER to ADMIN via the role dropdown → save
2. Log in as `testuser@aicrm.local` → **Expected**: Users and Tags menu items now visible
3. Change the role back to USER → log in again → **Expected**: admin items hidden again

### Scenario 4 — Deactivate a User (US2, SC-002)

1. As admin, deactivate `testuser@aicrm.local` (set status to Inactive)
2. Log out → try to log in as `testuser@aicrm.local`
3. **Expected**: generic login error "Invalid email or password"; access denied

### Scenario 5 — Self-Deactivation Prevention (US2)

1. Log in as `admin@aicrm.local`
2. Attempt to deactivate your own account
3. **Expected**: error message "You cannot deactivate your own account"; status unchanged

### Scenario 6 — Last Admin Protection

1. Ensure only one Admin account exists (`admin@aicrm.local`)
2. Attempt to deactivate it
3. **Expected**: error "Cannot deactivate the last active Admin account"
4. Attempt to demote it to USER role
5. **Expected**: error "Cannot demote the last Admin account"

### Scenario 7 — Create a Tag (US3, SC-003)

1. Navigate to `http://localhost:3000/admin/tags`
2. Click "New Tag" → drawer opens → enter Name "VIP", select colour blue
3. Click Save → **Expected**: tag appears in Tags table with contact count "0"
4. Navigate to a Contact → open tag picker → **Expected**: "VIP" tag is now available

### Scenario 8 — Delete a Tag Cascades to Contacts (US3, SC-003)

1. Assign the "VIP" tag to 2 contacts
2. Return to Tags page → delete "VIP" (confirm) 
3. **Expected**: tag removed from Tags table
4. Open the 2 previously-tagged contacts → **Expected**: "VIP" tag no longer appears
5. **Expected**: operation completes within 1 second

### Scenario 9 — USER Cannot Access Admin Pages (US4, SC-004)

1. Log in as a USER-role account
2. Attempt to navigate directly to `http://localhost:3000/admin/users`
3. **Expected**: redirected to `/dashboard`; no users page shown
4. Attempt: `Invoke-RestMethod -Uri http://localhost:5000/api/admin/users -Headers @{ Authorization = "Bearer $userToken" }`
5. **Expected**: `403 { error: { code: "FORBIDDEN" } }`

---

## API Smoke Tests

```powershell
$res = Invoke-RestMethod -Uri http://localhost:5000/api/auth/login -Method POST -ContentType "application/json" -Body '{"email":"admin@aicrm.local","password":"Admin1234!"}'
$token = $res.token

# List users
Invoke-RestMethod -Uri http://localhost:5000/api/admin/users -Headers @{ Authorization = "Bearer $token" }

# Create user
$user = '{"email":"smoke@aicrm.local","displayName":"Smoke Test","initialPassword":"Test1234!","role":"USER"}'
$u = Invoke-RestMethod -Uri http://localhost:5000/api/admin/users -Method POST -ContentType "application/json" -Headers @{ Authorization = "Bearer $token" } -Body $user
$userId = $u.id

# Change role
Invoke-RestMethod -Uri "http://localhost:5000/api/admin/users/$userId/role" -Method PATCH -ContentType "application/json" -Headers @{ Authorization = "Bearer $token" } -Body '{"role":"ADMIN"}'

# Deactivate
Invoke-RestMethod -Uri "http://localhost:5000/api/admin/users/$userId/status" -Method PATCH -ContentType "application/json" -Headers @{ Authorization = "Bearer $token" } -Body '{"status":"INACTIVE"}'

# Create tag
$tag = '{"name":"Test Tag","colour":"#EF4444"}'
$tg = Invoke-RestMethod -Uri http://localhost:5000/api/admin/tags -Method POST -ContentType "application/json" -Headers @{ Authorization = "Bearer $token" } -Body $tag
$tagId = $tg.id

# Delete tag
Invoke-RestMethod -Uri "http://localhost:5000/api/admin/tags/$tagId" -Method DELETE -Headers @{ Authorization = "Bearer $token" }
```

---

## Sign-Off Checklist

- [ ] New user can log in within 30 seconds of Admin saving their account
- [ ] Deactivated user login rejected 100% of the time immediately after deactivation
- [ ] Self-deactivation returns error and leaves account active
- [ ] Last-admin deactivation/demotion returns error
- [ ] Role change takes effect on the affected user's next page load
- [ ] Tag deletion removes tag from all Contact records within 1 second
- [ ] USER-role user cannot access `/admin/users` or `/admin/tags` (UI redirect + API 403)
- [ ] Duplicate email blocked at create time with clear error
- [ ] `users::list` Redis cache evicted after any user mutation
- [ ] `tags::list` Redis cache evicted after tag create/delete
