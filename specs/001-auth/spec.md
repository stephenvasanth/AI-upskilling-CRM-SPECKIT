# Feature Specification: Authentication & User Management

**Feature Branch**: `001-auth`
**Created**: 2026-06-16
**Status**: Draft

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Sign In (Priority: P1)

A team member opens the CRM and signs in with their email and password. On success they land on the
Dashboard. On failure they see a generic error message with no hint about which field was wrong.

**Why this priority**: Every other module depends on authenticated access. Nothing works without login.

**Independent Test**: Open the login page, enter valid credentials → land on Dashboard. Enter invalid
credentials → see generic error, stay on login page. Independently verifiable with no other module
needed.

**Acceptance Scenarios**:

1. **Given** a valid email and password, **When** the user clicks Sign In, **Then** they are redirected to the Dashboard and the session is active.
2. **Given** an incorrect password, **When** the user clicks Sign In, **Then** a generic error message is shown (no indication of which field is wrong) and the form remains visible.
3. **Given** an incorrect email address, **When** the user clicks Sign In, **Then** the same generic error is shown (identical to wrong-password response).
4. **Given** an active session that has expired (8 hours), **When** the user attempts any action, **Then** they are redirected to the login page.

---

### User Story 2 — Sign Out (Priority: P1)

A signed-in user clicks Logout. Their session ends immediately and they cannot access protected pages
without signing in again.

**Why this priority**: Session termination is a security fundamental; must ship alongside login.

**Independent Test**: Sign in → click Logout → verify redirect to login page → attempt to navigate to
Dashboard directly → confirm redirect back to login.

**Acceptance Scenarios**:

1. **Given** a signed-in user, **When** they click Logout, **Then** they are redirected to the login page and their session is invalidated.
2. **Given** a user who has logged out, **When** they try to navigate to any protected page, **Then** they are redirected to the login page.

---

### User Story 3 — Update Own Profile (Priority: P2)

A signed-in user visits their profile page and updates their display name or password.

**Why this priority**: Personal account management; important but not blocking for core CRM use.

**Independent Test**: Navigate to Profile → change name → save → verify name updated in sidebar.
Change password → log out → log back in with new password → verify success.

**Acceptance Scenarios**:

1. **Given** a signed-in user on the Profile page, **When** they update their display name and save, **Then** the new name is reflected across the application.
2. **Given** a signed-in user, **When** they change their password (providing a new password of at least 8 characters) and save, **Then** their old password no longer works and they can log in with the new one.
3. **Given** a new password shorter than 8 characters, **When** the user tries to save, **Then** an inline validation error is shown and the change is not saved.

---

### Edge Cases

- What happens when a user's account is deactivated while they are mid-session?
- What happens if the same user logs in from two different browser tabs simultaneously?
- What happens if a user tries to set an empty password on the profile page?

---

## Requirements *(mandatory)*

### Functional Requirements

- **AUTH-01**: Users MUST be able to log in using their email address and password.
- **AUTH-02**: Sessions MUST expire after 8 hours; the user MUST be redirected to the login page on expiry or any 401/403 response.
- **AUTH-03**: Passwords MUST be stored securely and never persisted in plain text.
- **AUTH-04**: Failed login attempts MUST return a generic error message — the message MUST NOT reveal whether the email address or the password was incorrect.
- **AUTH-05**: Users MUST be able to log out, which immediately ends their session; accessing protected pages after logout MUST redirect to login.
- **AUTH-06**: Users MUST be able to view and update their own display name.
- **AUTH-07**: Users MUST be able to change their own password; the new password MUST be at least 8 characters long.
- **AUTH-08**: The system MUST reject passwords shorter than 8 characters with a clear inline validation message before the form is submitted.

### Key Entities

- **User** — A team member with an email address, display name, role (USER or ADMIN), status (Active / Inactive), and a securely stored password. Roles and status are managed by Admins (see module 007-admin).

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of protected pages redirect unauthenticated visitors to the login page.
- **SC-002**: Session expiry enforcement is consistent — no protected resource is accessible after 24 hours without re-authentication.
- **SC-003**: Login error messages for wrong-email and wrong-password scenarios are identical (verified by inspection).
- **SC-004**: Password change is effective immediately — the old password is rejected on the next login attempt.
- **SC-005**: Profile name updates are visible across the application within a single page refresh.

---

## Assumptions

- Each user has a unique email address; the system does not support multiple accounts per email.
- There is no self-registration flow — accounts are created by an Admin (see module 007-admin).
- "Forgot password" / password reset via email is out of scope for this release.
- Session state is maintained client-side; clearing browser storage effectively logs the user out.
- Deactivated users are blocked at login — if a user is deactivated mid-session the session remains valid until natural expiry at 8 hours (enforcement on next login).
