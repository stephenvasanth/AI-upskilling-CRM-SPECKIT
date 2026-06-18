# Feature Specification: Admin — User & Tag Management

**Feature Branch**: `007-admin`
**Created**: 2026-06-16
**Status**: Draft

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Invite a New Team Member (Priority: P1)

An Admin creates a new user account by entering the person's name, email address, and assigning
them a role (USER or ADMIN). The new account is immediately active and the person can log in.

**Why this priority**: Without user creation, no one else can access the system — it is a
foundational admin capability.

**Independent Test**: Log in as Admin → navigate to Users page → click "Invite User" → enter name,
email, initial password, and role → save → log out → log in as the new user → verify access is
granted with the assigned role.

**Acceptance Scenarios**:

1. **Given** an Admin on the Users page, **When** they create a new user with name, email, password, and role, **Then** the new user appears in the Users table and can log in immediately.
2. **Given** a new user form with a duplicate email address, **When** the Admin tries to save, **Then** an inline error is shown and the duplicate account is not created.
3. **Given** a new user form with a missing required field (name or email), **When** the Admin tries to save, **Then** an inline error blocks submission.

---

### User Story 2 — Manage User Roles and Status (Priority: P1)

An Admin changes a team member's role from USER to ADMIN (or vice versa), or deactivates an account
to prevent login without deleting the user's history.

**Why this priority**: Role and status changes are ongoing operations as teams grow or restructure.

**Independent Test**: Change a USER to ADMIN → log in as that user → verify Admin-only pages (Users,
Tags) are now accessible. Deactivate the user → attempt login as that user → verify login is
rejected.

**Acceptance Scenarios**:

1. **Given** an Admin changes a USER's role to ADMIN, **When** the change is saved, **Then** that user can access Admin-only sections (Users management, Tags management) on their next page load.
2. **Given** an Admin changes an ADMIN's role to USER, **When** the change is saved, **Then** that user can no longer access Admin-only sections.
3. **Given** an Admin deactivates a user account, **When** the deactivated user attempts to log in, **Then** login is rejected and the generic login error is shown.
4. **Given** an Admin tries to deactivate their own account, **When** they initiate the action, **Then** the system prevents it and shows a warning (an Admin cannot deactivate themselves).

---

### User Story 3 — Create and Delete Tags (Priority: P2)

An Admin creates a new tag by giving it a name and choosing a colour. The tag immediately becomes
available for assignment to Contacts. An Admin can also delete a tag, which removes it from all
Contacts it was applied to.

**Why this priority**: Tags are managed centrally by Admins; Users depend on them for contact
organisation but cannot create them.

**Independent Test**: Log in as Admin → create a tag "VIP" with green colour → navigate to a Contact
→ verify "VIP" tag is available for assignment. Delete the "VIP" tag → open a Contact that had it
assigned → verify the tag no longer appears.

**Acceptance Scenarios**:

1. **Given** an Admin creates a tag with a name and colour, **When** saved, **Then** the tag appears in the Tags list and is immediately available in the Contact tag multi-select.
2. **Given** a tag name field is left empty, **When** the Admin tries to save, **Then** an inline error blocks submission.
3. **Given** a tag that is assigned to one or more Contacts, **When** an Admin deletes it after confirming, **Then** the tag is removed from all Contacts and no longer appears anywhere in the system.
4. **Given** an Admin initiates tag deletion, **When** the confirmation dialog appears, **Then** clicking Cancel leaves the tag and all its assignments unchanged.

---

### User Story 4 — Non-Admin Access Control (Priority: P1)

A USER-role user is prevented from accessing any Admin-only page or performing any Admin-only action.

**Why this priority**: Access control is a security requirement; it must be enforced on every release.

**Independent Test**: Log in as USER-role user → attempt to navigate directly to `/users` and `/tags`
→ verify both are inaccessible (redirect or 403).

**Acceptance Scenarios**:

1. **Given** a USER-role user, **When** they navigate to `/users`, **Then** they are redirected or shown an access-denied message.
2. **Given** a USER-role user, **When** they navigate to `/tags`, **Then** they are redirected or shown an access-denied message.
3. **Given** a USER-role user, **When** they call any Admin-only API endpoint directly, **Then** they receive an access-denied response and the action is not performed.

---

### Edge Cases

- What happens to the Contacts owned by a deactivated user — are they reassigned?
- Can an Admin be demoted to USER if they are the last Admin in the system?
- What happens to tasks assigned to a deactivated user?
- Can two tags have the same name?

---

## Requirements *(mandatory)*

### Functional Requirements

- **ADM-01**: Admin users MUST be able to create new user accounts with: name (required), email (required, unique), initial password, and role (USER or ADMIN).
- **ADM-02**: Admin users MUST be able to change any user's role between USER and ADMIN.
- **ADM-03**: Admin users MUST be able to deactivate a user account; deactivated users MUST be unable to log in.
- **ADM-04**: An Admin MUST NOT be able to deactivate their own account.
- **ADM-05**: The Users management page MUST display all users with: name, email, role badge, status (Active / Inactive), and joined date.
- **ADM-06**: Admin users MUST be able to create a Tag with a name (required) and a colour.
- **ADM-07**: Admin users MUST be able to delete a Tag; deletion MUST be preceded by a confirmation prompt and MUST remove the tag from all Contacts it was assigned to.
- **ADM-08**: The Tags management page MUST display all tags with: colour swatch, name, and the count of Contacts the tag is assigned to.
- **ADM-09**: All Admin-only pages and API actions MUST be inaccessible to USER-role users; attempting access MUST result in an access-denied response.

### Key Entities

- **User** — A team member. Key attributes: name, email (unique), role (USER / ADMIN), status (Active / Inactive), joined date.
- **Tag** — A coloured label. Key attributes: name (required), colour (hex or preset palette). Linked to zero or more Contacts.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A newly created user can log in within 30 seconds of the Admin saving their account.
- **SC-002**: A deactivated user's login attempt is rejected 100% of the time — verified by attempting login immediately after deactivation.
- **SC-003**: A deleted tag is removed from all Contact records within 1 second of deletion — verified by checking Contact detail pages that previously displayed the tag.
- **SC-004**: A USER-role user cannot access any Admin-only page or API — verified by direct URL navigation and direct API call attempts.
- **SC-005**: Role changes take effect within one page refresh — the affected user sees their new permissions the next time their browser loads a page.

---

## Assumptions

- Initial password for new users is set by the Admin at creation time; the new user can change it via their Profile page.
- There is no email-based invitation flow — the Admin shares credentials directly with the new user.
- Tag names are not required to be unique (same name, different colour is allowed); however, duplicate names should be visually distinguishable by colour.
- Deactivating a user does not reassign their owned Contacts or Deals — those records retain the original owner reference.
- The last Admin in the system cannot be deactivated or demoted to USER (prevents admin lock-out); this constraint is enforced by the system.
- USER-role users can see the sidebar without the Admin sections (Users, Tags); those items are hidden from non-Admin navigation.
- There is no audit log of Admin actions in this release.
