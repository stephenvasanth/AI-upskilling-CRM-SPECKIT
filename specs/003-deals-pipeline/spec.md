# Feature Specification: Deals Pipeline

**Feature Branch**: `003-deals-pipeline`
**Created**: 2026-06-16
**Status**: Draft

## User Scenarios & Testing *(mandatory)*

### User Story 1 — View the Pipeline Board (Priority: P1)

A user opens the Deals page and sees all active deals laid out as a Kanban board, grouped by stage.
Each column shows the stage name, number of deals, and total value. Closed Lost cards appear visually
muted.

**Why this priority**: The Kanban board is the primary view for the Deals module — without it there
is nothing to interact with.

**Independent Test**: With at least one deal in each stage present, open `/deals` → verify 6 columns
(Lead → Closed Lost) are visible → verify each column header shows deal count and total value →
verify Closed Lost cards appear muted compared to other cards.

**Acceptance Scenarios**:

1. **Given** deals exist across multiple stages, **When** a user opens the Pipeline page, **Then** they see a column for each of the 6 stages in the fixed order: Lead, Qualified, Proposal, Negotiation, Closed Won, Closed Lost.
2. **Given** a stage column, **When** the user views the column header, **Then** it shows the number of deals in that stage and their combined value.
3. **Given** deals in the Closed Lost stage, **When** displayed on the board, **Then** their cards appear visually muted (reduced opacity) compared to cards in other stages.
4. **Given** a stage with no deals, **When** displayed on the board, **Then** the column still appears with a zero count and no cards.

---

### User Story 2 — Create a Deal (Priority: P1)

A user creates a new deal by clicking "New Deal", filling in the title, value, stage, expected close
date, linked contact, and owner, then saving.

**Why this priority**: Creating deals is the primary action of the pipeline module.

**Independent Test**: Click "New Deal" → fill in title and stage → save → verify deal card appears
in the correct column on the board.

**Acceptance Scenarios**:

1. **Given** a user clicks "New Deal", **When** they enter a title (required) and select a stage, **Then** they can save the deal and it appears in the correct stage column.
2. **Given** a deal form with no title, **When** the user tries to save, **Then** an inline error is shown and submission is blocked.
3. **Given** a newly created deal with a value, **When** it appears on the board, **Then** the column header total value updates to include the new deal.

---

### User Story 3 — Move a Deal Between Stages (Priority: P1)

A user drags a deal card from one stage column to another. The card moves immediately (optimistic
update) and the column totals recalculate. If the server rejects the move, the card reverts to its
original position and a notification is shown.

**Why this priority**: Stage progression is the core workflow of the sales pipeline.

**Independent Test**: Drag a deal from "Lead" to "Qualified" → verify card appears in Qualified →
verify both column counts and values update. Simulate server failure → verify card reverts and error
toast appears.

**Acceptance Scenarios**:

1. **Given** a deal card in any stage, **When** a user drags it to another stage column, **Then** the card moves immediately and both the source and target column counts and values update.
2. **Given** the server fails to persist the stage change, **When** the error is received, **Then** the deal card reverts to its previous column and a notification informs the user of the failure.
3. **Given** a deal in Closed Lost, **When** moved to another stage, **Then** the visual muting is removed and the card renders normally.

---

### User Story 4 — Edit a Deal (Priority: P2)

A user clicks on a deal card to open a side panel and update any of its fields — title, value, close
date, linked contact, owner, or notes.

**Why this priority**: Deal details change throughout the sales cycle; editing is essential but can
follow the view/create flow.

**Independent Test**: Click a deal card → side panel opens → update the value → save → verify the
new value appears on the card and in the column total.

**Acceptance Scenarios**:

1. **Given** a user clicks a deal card, **When** the edit panel opens, **Then** all current deal fields are pre-populated.
2. **Given** a user updates the deal value and saves, **When** the panel closes, **Then** the card reflects the new value and the column total is recalculated.
3. **Given** a user clears the deal title, **When** they try to save, **Then** an inline error is shown and the change is not saved.

---

### User Story 5 — Delete a Deal (Priority: P2)

A user deletes a deal they no longer want to track. A confirmation prompt is shown before removal.

**Why this priority**: Cleanup of stale or erroneous deals is needed but less frequent.

**Independent Test**: Open a deal → click Delete → confirm → verify card disappears and column count
and value update.

**Acceptance Scenarios**:

1. **Given** a user initiates deal deletion, **When** the confirmation dialog appears, **Then** clicking Cancel leaves the deal unchanged.
2. **Given** the user confirms deletion, **When** the action completes, **Then** the card is removed from the board and the column total is updated.

---

### Edge Cases

- What happens if a user tries to drag a deal while the board is still loading?
- How are deals displayed when a column contains more cards than the visible area?
- What is the behaviour when two users move the same deal to different stages simultaneously?
- How does value display handle non-USD currencies or blank values?

---

## Requirements *(mandatory)*

### Functional Requirements

- **DEA-01**: Users MUST be able to create a Deal with: title (required), value, stage (required, defaults to Lead), expected close date, linked Contact, owner, and notes.
- **DEA-02**: The Deals page MUST display all deals as a Kanban board with one column per pipeline stage.
- **DEA-03**: Pipeline stages are fixed and MUST appear in this order: Lead → Qualified → Proposal → Negotiation → Closed Won → Closed Lost. Stages cannot be added, renamed, or removed.
- **DEA-04**: Each stage column header MUST show the count of deals and their combined value.
- **DEA-05**: Closed Lost deal cards MUST be visually muted (reduced opacity) on the board.
- **DEA-06**: Users MUST be able to move a deal between stages by dragging its card to a different column; the move MUST apply optimistically and revert on server failure with a notification.
- **DEA-07**: Users MUST be able to edit all fields of a Deal via a side panel; edits MUST be reflected on the card and in column totals immediately on save.
- **DEA-08**: Users MUST be able to delete a Deal after confirming a prompt; deletion removes the Deal record only (linked Activities and Tasks are not deleted).

### Key Entities

- **Deal** — A sales opportunity. Key attributes: title, monetary value, pipeline stage, expected close date, linked Contact, assigned owner, notes. Progresses through fixed stages.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The Pipeline board loads and displays all deals within 1 second.
- **SC-002**: A deal card moves to its new column within 200 ms of the user releasing the drag (optimistic update; no waiting for server confirmation).
- **SC-003**: Column counts and total values are always accurate after every create, edit, move, or delete action — verified by comparing displayed totals to the sum of visible cards.
- **SC-004**: 100% of deal deletions are preceded by a confirmation dialog.
- **SC-005**: A server-side stage-change failure causes a visible revert and notification within 3 seconds.

---

## Assumptions

- Deal value is a single currency amount (display format: local currency symbol + number); multi-currency support is out of scope.
- A Deal can exist without a linked Contact (contact is optional on create/edit).
- Stage progression is not enforced — a deal can be moved to any stage regardless of current stage.
- Deleting a Deal does not delete linked Activities or Tasks; those records retain their Deal reference cleared or become orphaned per data model decisions (resolved in plan).
- The board is not filtered by default — all deals across all owners are visible to all users.
- Deals are not soft-deleted; deletion is permanent.
