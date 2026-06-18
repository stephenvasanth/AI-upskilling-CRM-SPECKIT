# Feature Specification: Activity Logging

**Feature Branch**: `004-activities`
**Created**: 2026-06-16
**Status**: Draft

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Log an Activity Against a Contact or Deal (Priority: P1)

A user records an interaction — a call made, an email sent, a meeting held, or a note written —
against a specific contact or deal. The activity immediately appears at the top of that contact's
or deal's activity feed.

**Why this priority**: Activity logging is the primary value of this module; it creates the
historical record of all interactions.

**Independent Test**: From a contact's detail page, click "Log Activity" → select type "Call" →
enter a subject and notes → save → verify the new activity appears at the top of the feed with the
correct type, subject, author, and timestamp.

**Acceptance Scenarios**:

1. **Given** a user on a Contact detail page, **When** they log an Activity with a type and subject, **Then** the activity appears at the top of the Contact's activity feed immediately after saving.
2. **Given** a user on a Deal edit panel, **When** they log an Activity linked to that Deal, **Then** the activity appears in the Deal's activity feed.
3. **Given** a log form with no subject entered, **When** the user tries to save, **Then** an inline error is shown and submission is blocked.
4. **Given** an activity is logged, **When** viewed in the feed, **Then** the author's name and the date/time of logging are displayed alongside the type, subject, and notes.

---

### User Story 2 — View Activity Feed per Contact / Deal (Priority: P1)

A user opens a contact or deal and sees a chronological list of all interactions logged against it,
most recent first.

**Why this priority**: Reviewing interaction history is the most frequent action after logging.

**Independent Test**: Open a contact with 5 logged activities → verify all 5 appear in reverse-
chronological order with type icon, subject, author, and timestamp.

**Acceptance Scenarios**:

1. **Given** a Contact with multiple logged Activities, **When** a user opens the Contact detail page, **Then** activities are listed in reverse-chronological order (most recent first).
2. **Given** a Contact with no logged Activities, **When** a user views the feed, **Then** an empty state message and a "Log Activity" call-to-action are displayed.
3. **Given** an activity of each type (Call, Email, Meeting, Note), **When** displayed in the feed, **Then** each entry shows a distinct visual indicator (icon/colour) for its type.

---

### User Story 3 — Browse the Global Activity Feed (Priority: P2)

A user opens the Activities page to see a unified, chronological feed of all activities across all
contacts and deals, with filters to narrow by type, contact, or date range.

**Why this priority**: The global feed gives managers visibility across the whole team's activity,
complementing the per-contact view.

**Independent Test**: Navigate to `/activities` → verify activities from multiple contacts appear →
filter by type "Email" → verify only email activities show → filter by date range → verify only
activities within that range show.

**Acceptance Scenarios**:

1. **Given** activities exist across multiple contacts and deals, **When** a user opens the Activities page, **Then** all activities are listed in reverse-chronological order.
2. **Given** the user applies a type filter (e.g., "Call"), **When** the feed updates, **Then** only activities of that type are shown.
3. **Given** the user applies a date range filter, **When** the feed updates, **Then** only activities within that range are shown.
4. **Given** filters are applied, **When** the user clears them, **Then** the full activity feed is restored.

---

### User Story 4 — Delete an Activity (Priority: P2)

A user removes an incorrectly logged activity. A confirmation prompt is shown before deletion.

**Why this priority**: Correction of data entry mistakes is necessary; editing is deferred to a
future release so deletion is the only remedy.

**Independent Test**: Log an activity → hover over it → click Delete → confirm → verify the activity
is removed from the feed.

**Acceptance Scenarios**:

1. **Given** a user initiates activity deletion, **When** the confirmation dialog appears, **Then** clicking Cancel leaves the activity unchanged.
2. **Given** the user confirms deletion, **When** the action completes, **Then** the activity no longer appears in any feed (contact feed, deal feed, or global feed).

---

### Edge Cases

- What happens if the user logs an activity without linking it to any Contact or Deal?
- How does the global feed behave with very large numbers of activities (pagination)?
- What is displayed if both a Contact and a Deal are linked to the same activity?
- Are activities in the feed updated in real time if another user logs an activity while the feed is open?

---

## Requirements *(mandatory)*

### Functional Requirements

- **ACT-01**: Users MUST be able to log an Activity of one of four types: Call, Email, Meeting, or Note.
- **ACT-02**: Each Activity MUST have: type (required), subject (required), notes/body (optional), date/time (defaults to now), author (the logged-in user), and optional links to a Contact and/or a Deal.
- **ACT-03**: Activities MUST be displayed in reverse-chronological order in the feed for each Contact and each Deal.
- **ACT-04**: Each Activity entry in the feed MUST display: type indicator, subject, notes preview, linked Contact/Deal chip, author name, and formatted date/time.
- **ACT-05**: Users MUST be able to delete an Activity after confirming a prompt; deletion removes the Activity from all feeds immediately.
- **ACT-06**: A global Activities page MUST show all activities across the system in reverse-chronological order, paginated, with filters for type, Contact, and date range.
- **ACT-07** *(Deferred)*: Editing an existing Activity is not supported in this release.
- **ACT-08** *(Deferred)*: Restricting deletion to the Activity's author is not supported in this release — any user may delete any activity.

### Key Entities

- **Activity** — A logged interaction. Key attributes: type (Call / Email / Meeting / Note), subject, notes, date/time logged, author (User), optional linked Contact, optional linked Deal.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new Activity appears in the relevant feed within 1 second of the user clicking Save.
- **SC-002**: The global Activities feed loads its first page within 1 second.
- **SC-003**: Type filter and date range filter each update the feed within 500 ms of being applied.
- **SC-004**: 100% of activity deletions are preceded by a confirmation dialog.
- **SC-005**: Activities are always sorted most-recent-first with no manual sort required.

---

## Assumptions

- Any authenticated user can log an Activity against any Contact or Deal regardless of ownership.
- An Activity can be logged without linking to a Contact or Deal (standalone note).
- The date/time field defaults to the current date and time but can be adjusted by the user (backdating is allowed).
- Editing activities and author-restricted deletion are explicitly deferred to a future release.
- The global feed is paginated; the page size is 20 activities per page (consistent with Contacts list).
- Activity notes support plain text only; rich text / formatting is out of scope for this release.
