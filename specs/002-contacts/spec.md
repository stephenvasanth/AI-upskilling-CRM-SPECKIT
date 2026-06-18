# Feature Specification: Contact Management

**Feature Branch**: `002-contacts`
**Created**: 2026-06-16
**Status**: Draft

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Create a Contact (Priority: P1)

A user adds a new person to the CRM by filling in their details — name, email, phone, job title,
company, owner, and tags. After saving they land on the Contact detail page.

**Why this priority**: The Contact is the core entity of the CRM; all other modules (Deals,
Activities, Tasks) link back to it. An empty contacts list makes the whole system unusable.

**Independent Test**: Create a contact with a first name, last name, and email → verify it appears
in the contacts list → open the detail page → verify all saved fields are correct.

**Acceptance Scenarios**:

1. **Given** a user on the New Contact form, **When** they enter at least a first and last name and click Save, **Then** a new Contact is created and they are taken to that Contact's detail page.
2. **Given** an email address entered on the form, **When** the format is invalid (e.g., missing @), **Then** an inline error is shown and the form cannot be submitted.
3. **Given** the form is submitted without a first or last name, **When** the user clicks Save, **Then** inline validation errors highlight the required fields and submission is blocked.
4. **Given** a saved Contact, **When** the user navigates to the Contacts list, **Then** the new Contact appears in the list with their name, company, email, and tags visible.

---

### User Story 2 — Search and Filter Contacts (Priority: P1)

A user finds a specific contact by typing a name, email, or company into the search bar. Results
update as they type. They can also filter by tag to narrow the list.

**Why this priority**: Without search the contacts list is unusable beyond a handful of records.

**Independent Test**: With 20+ contacts present, type part of a name → verify only matching results
show. Clear search → filter by tag → verify only tagged contacts show.

**Acceptance Scenarios**:

1. **Given** a non-empty contacts list, **When** the user types in the search bar, **Then** the list filters in real time (updates within 300 ms of the user pausing typing) to show only contacts matching by name, email, or company.
2. **Given** a search term that matches no contacts, **When** the list updates, **Then** an empty state message is shown (e.g., "No contacts match your search").
3. **Given** one or more tags exist, **When** the user selects a tag filter, **Then** only contacts assigned that tag are shown.
4. **Given** both a search term and a tag filter are active, **When** the list updates, **Then** only contacts matching both criteria are shown.

---

### User Story 3 — View Contact Detail (Priority: P1)

A user clicks on a contact to open their detail page, which shows all personal info, linked deals,
linked activities, and linked tasks in one place.

**Why this priority**: The detail page is the hub that connects all CRM data for a person.

**Independent Test**: Open an existing contact's detail page → verify name, job title, company,
email, phone, owner, and tags are displayed → verify linked deals section exists → verify activity
feed and tasks tabs are present.

**Acceptance Scenarios**:

1. **Given** a Contact with linked deals, **When** the user opens the detail page, **Then** linked deal cards are shown with their stage and value.
2. **Given** a Contact with logged activities, **When** the user views the Activity Feed panel, **Then** activities appear in reverse-chronological order.
3. **Given** a Contact with linked tasks, **When** the user views the Tasks section, **Then** all associated tasks are listed with their due date and status.

---

### User Story 4 — Edit a Contact (Priority: P1)

A user updates one or more fields on an existing contact (e.g., new phone number, changed job title)
and saves the changes.

**Why this priority**: Contact data changes over time; editing is part of the core contact lifecycle.

**Independent Test**: Open an existing contact → click Edit → change the phone number → save → verify
the new phone number appears on the detail page and in the list.

**Acceptance Scenarios**:

1. **Given** an existing Contact, **When** a user edits any field and saves, **Then** the updated values are immediately reflected on the detail page.
2. **Given** an edit that clears a required field (first or last name), **When** the user tries to save, **Then** an inline error is shown and the change is not saved.

---

### User Story 5 — Delete a Contact (Priority: P2)

A user permanently removes a contact and all their directly linked activities from the CRM. A
confirmation prompt is shown before deletion.

**Why this priority**: Deletion is necessary housekeeping but less frequent than creating/editing.

**Independent Test**: Create a contact with 2 linked activities and 1 linked task → delete the
contact → confirm the contact and activities are gone → verify the task still exists with no contact
link.

**Acceptance Scenarios**:

1. **Given** a user clicks Delete on a contact, **When** the confirmation dialog appears, **Then** clicking Cancel leaves the contact unchanged.
2. **Given** a user confirms the deletion, **When** the action completes, **Then** the contact no longer appears in the list, their directly-linked Activities are also removed, and linked Tasks remain with their Contact reference cleared.

---

### Edge Cases

- What happens if two users try to edit the same contact simultaneously?
- What if a contact has no email or phone — are those fields truly optional?
- What is the behaviour of the search when the list is paginated (does search apply across all pages)?
- How are tags displayed when a contact has more than 3 tags assigned?

---

## Requirements *(mandatory)*

### Functional Requirements

- **CON-01**: Users MUST be able to create a Contact with: first name (required), last name (required), email, phone, job title, company (lookup), owner, and tags.
- **CON-02**: Email addresses entered on the Contact form MUST be validated for correct format.
- **CON-03**: Users MUST be able to edit any field on an existing Contact.
- **CON-04**: Users MUST be able to delete a Contact. Deletion MUST be preceded by a confirmation prompt. Deletion permanently removes the Contact and their directly-linked Activities; linked Tasks are preserved with the Contact reference cleared.
- **CON-05**: Users MUST be able to search Contacts by name, email, or company; results MUST update within 300 ms of the user pausing typing.
- **CON-06**: Users MUST be able to filter Contacts by tag.
- **CON-07**: The Contacts list MUST be paginated (default 20 records per page).
- **CON-08**: Each Contact MUST have a detail page showing personal info, linked Deals, an Activity Feed, and linked Tasks.
- **CON-09**: Users MUST be able to link a Contact to a Company from a lookup list.
- **CON-10**: Users MUST be able to assign multiple Tags to a Contact.
- **CON-11** *(Nice to Have)*: Users SHOULD be able to upload or replace a Contact avatar image.

### Key Entities

- **Contact** — An individual tracked in the CRM. Key attributes: first name, last name, email, phone, job title, company (linked), owner (team member), tags (multiple), avatar (optional). Linked to Deals, Activities, and Tasks.
- **Company** — A read-only lookup (name only) used to populate the company picker on the Contact form. Full Company management is deferred to a future release.
- **Tag** — A coloured label managed by Admins (see module 007-admin) and assignable to Contacts in bulk.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new Contact can be created, saved, and viewed on its detail page in under 60 seconds by a first-time user.
- **SC-002**: Contact search results appear within 300 ms of the user pausing typing, for a list of up to 10,000 contacts.
- **SC-003**: 100% of Contact deletions show a confirmation dialog before any data is removed.
- **SC-004**: After a Contact is deleted, their linked Activities are not accessible anywhere in the system; linked Tasks remain visible with no Contact reference.
- **SC-005**: The Contacts list loads the first page (20 records) within 1 second.

---

## Assumptions

- First name and last name are the only required fields; all other fields are optional.
- Email format validation follows standard rules (contains @, valid domain); uniqueness of email is not enforced in this release.
- The Company field is a simple lookup (select from existing list); creating new Companies from the Contact form is not supported in this release.
- Tags are pre-created by Admins; users cannot create new Tags from the Contact form.
- Contact avatars (CON-11) use initials-based generated avatars by default; image upload is a nice-to-have that does not block the core flow.
- The Contacts list defaults to sorting by creation date (newest first); user-defined sort is not required in this release.
- Search applies to the full dataset, not just the current page.
