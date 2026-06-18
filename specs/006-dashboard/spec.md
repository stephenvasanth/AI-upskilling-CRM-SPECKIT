# Feature Specification: Dashboard

**Feature Branch**: `006-dashboard`
**Created**: 2026-06-16
**Status**: Draft

## User Scenarios & Testing *(mandatory)*

### User Story 1 — See a Personal Snapshot on Login (Priority: P1)

After signing in, a user immediately sees the Dashboard — a single-page summary showing their open
tasks, key pipeline metrics, recent activity across the team, and the overall deal pipeline by stage.

**Why this priority**: The Dashboard is the default landing page; it must load and display useful
information immediately after login.

**Independent Test**: Log in → verify the Dashboard loads as the first screen → verify all four
sections are present (metric cards, pipeline summary, My Tasks widget, Recent Activity feed) →
verify metric numbers reflect current data.

**Acceptance Scenarios**:

1. **Given** a user successfully logs in, **When** they are redirected, **Then** the Dashboard is the first page they see.
2. **Given** the Dashboard loads, **When** the user views the metric cards, **Then** they see: count of open deals with total pipeline value, count of their tasks due today, and count of contacts added this week.
3. **Given** the Dashboard loads, **When** the user views the Pipeline Summary chart, **Then** they see deal counts per active stage (Lead through Closed Won; Closed Lost may be excluded from the chart).
4. **Given** the Dashboard loads, **When** the user views the My Tasks widget, **Then** they see up to 5 of their upcoming/overdue tasks with due dates colour-coded (red = overdue, orange = today, grey = future).
5. **Given** the Dashboard loads, **When** the user views the Recent Activity feed, **Then** they see the 10 most recent activities across all contacts and deals, with type, subject, linked contact name, and timestamp.

---

### User Story 2 — Navigate to Details from the Dashboard (Priority: P2)

A user clicks on an item in the My Tasks widget or Recent Activity feed and is taken directly to the
relevant task, contact, or deal.

**Why this priority**: The Dashboard is a hub; it is most useful when it connects to the detail
it summarises.

**Independent Test**: Click a task in the My Tasks widget → verify navigation to the Tasks page
(or task detail). Click an activity entry → verify navigation to the linked contact's detail page.

**Acceptance Scenarios**:

1. **Given** a task in the My Tasks widget, **When** a user clicks on it, **Then** they are taken to the Tasks list (or the task detail if available) with that task visible.
2. **Given** an activity entry in the Recent Activity feed, **When** a user clicks the linked contact's name, **Then** they are taken to that Contact's detail page.
3. **Given** a "View all tasks" link at the bottom of the My Tasks widget, **When** clicked, **Then** the user is taken to the full Tasks list.

---

### Edge Cases

- What does the Dashboard show for a brand-new user with no contacts, deals, or tasks? (Show empty state with CTAs for each section.)
- What is shown in the Pipeline Summary when there are no deals in any stage?
- Does the My Tasks widget show completed tasks? (No — only incomplete tasks.)
- How frequently does Dashboard data refresh — on page load only, or automatically?

---

## Requirements *(mandatory)*

### Functional Requirements

- **DSH-01**: The Dashboard MUST be the default landing page after a successful login.
- **DSH-02**: The Dashboard MUST display three metric summary cards: (1) open deal count and total pipeline value, (2) current user's tasks due today count, (3) contacts added in the last 7 days count.
- **DSH-03**: The Dashboard MUST display a Pipeline Summary visual showing deal counts per stage (Lead through Closed Won).
- **DSH-04**: The Dashboard MUST display a "My Tasks" widget listing up to 5 of the current user's incomplete tasks, sorted by due date ascending, with due date colour-coding (red = overdue, orange = due today, grey = future).
- **DSH-05**: The "My Tasks" widget MUST include a "View all tasks" link that navigates to the full Tasks list.
- **DSH-06**: The Dashboard MUST display a "Recent Activity" feed showing the 10 most recent activities across all contacts and deals, with type indicator, subject, linked contact/deal name, author, and timestamp.
- **DSH-07**: Each empty section on the Dashboard MUST display an empty state with a relevant call-to-action (e.g., "No deals yet — Create your first deal").
- **DSH-08**: Dashboard data MUST reflect the current state of the system at the time the page is loaded.

### Key Entities

The Dashboard aggregates data from all other modules — no new entities are introduced. It reads from: Deals, Tasks, Contacts, and Activities.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The Dashboard loads and displays all four sections within 2 seconds of the user landing on the page.
- **SC-002**: Metric card numbers are accurate — verified by comparing displayed values to counts in the respective module lists.
- **SC-003**: The My Tasks widget never shows completed tasks — verified by marking all tasks complete and confirming the widget shows zero or an empty state.
- **SC-004**: The Recent Activity feed always shows exactly the 10 most recent activities — verified by logging a new activity and confirming it displaces the oldest entry.
- **SC-005**: Every section with no data shows an actionable empty state, not a blank area.

---

## Assumptions

- Dashboard data is fetched fresh on each page load; auto-refresh while the page is open is not required in this release.
- The Pipeline Summary chart excludes Closed Lost deals (they are tracked separately, not part of the active pipeline value).
- "Open deals" in the metric card means deals in any stage except Closed Won and Closed Lost.
- "Contacts added this week" uses a rolling 7-day window from the current date, not a calendar week boundary.
- The My Tasks widget shows the current user's tasks only, sorted by nearest due date first.
- The Recent Activity feed is global (all users' activities) — not filtered to the current user.
- Clicking metric cards does not navigate to a filtered view in this release (cards are read-only summaries).
