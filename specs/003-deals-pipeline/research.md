# Research: Deals Pipeline

**Feature**: `003-deals-pipeline` | **Date**: 2026-06-16

> Stack decisions established in `001-auth/research.md`. This file documents module-specific decisions.

---

## Decision 1: Kanban Drag-and-Drop Library

**Decision**: Angular CDK `@angular/cdk/drag-drop` — `CdkDropListGroup` + `CdkDropList` + `CdkDrag`

**Rationale**:
- CDK DragDrop ships with Angular; no extra dependency; works with Angular signals
- `cdkDropListConnected` links all 6 stage columns so cards can be transferred
- `(cdkDropListDropped)` event fires synchronously on release — used for optimistic UI
- No layout thrashing: CDK handles placeholder rendering and reorder animation
- Accessibility: keyboard move supported via CDK

**Alternatives considered**:
- **SortableJS** — widely used but requires a wrapper for Angular; adds 20 KB
- **ng-drag-drop** — community library; less maintained than CDK

---

## Decision 2: Optimistic Stage Update Pattern

**Decision**: Snapshot board state in a `signal<DealBoardDto>` before drag; apply move immediately; revert on HTTP error + toast

**Rationale**:
- Constitution principle IV requires optimistic UI for deal stage drag
- Angular signals enable synchronous state update without change detection overhead
- Pre-drag snapshot is a shallow copy of `boardState()` stored in component; on
  `catchError` in the HTTP Observable, `boardState.set(snapshot)` reverts the board

**Sequence**:
1. User releases drag → `(cdkDropListDropped)` fires
2. Component snapshots current `boardState()` signal value
3. Component immediately moves card to new column via `signal.update()`
4. HTTP `PATCH /api/deals/{id}/stage` fires in background
5. On success → snapshot discarded; board stays
6. On error → `boardState.set(snapshot)` reverts board; `ToastService.error(...)` fires

---

## Decision 3: Deal Stage Representation

**Decision**: Java enum `DealStage` stored as `VARCHAR(20)` in DB; frontend defines ordered array `STAGE_ORDER` for column rendering

**Rationale**:
- Stages are fixed by constitution; an enum prevents invalid values at both DB and
  Java layer
- `VARCHAR` storage (not int ordinal) makes migrations readable and safe to reorder
  in the future without data corruption
- Angular component defines:
  ```typescript
  const STAGE_ORDER: DealStage[] = [
    'LEAD', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'
  ];
  ```
  Columns are rendered by iterating this array — order is purely frontend config

---

## Decision 4: Column Total Computation

**Decision**: Computed client-side from cached board data; not a server aggregate

**Rationale**:
- `DealBoardDto` returns all deals grouped by stage; Angular component derives
  `count` and `totalValue` per column via `computed(() => ...)` signals
- Avoids a second API call for totals; values stay in sync with the board state
  without additional invalidation logic
- On optimistic move: totals update immediately as part of the signal update

---

## Decision 5: Currency / Value Display

**Decision**: `NUMERIC(15,2)` in PostgreSQL; displayed as-is with local currency symbol from a configurable constant

**Rationale**:
- Single-currency assumption stated in spec; `NUMERIC(15,2)` prevents floating-point rounding
- Display format: `$ {value.toLocaleString()}` — no i18n library required
- Multi-currency support explicitly deferred to future release

---

## Summary

| Area | Decision |
|------|----------|
| DnD library | Angular CDK `CdkDropListGroup`/`CdkDropList`/`CdkDrag` |
| Optimistic UI | Signal snapshot → apply → revert on error + toast |
| Stage storage | Java enum + `VARCHAR(20)` in DB |
| Column totals | Client-side `computed()` signals from board data |
| Currency | `NUMERIC(15,2)`; single currency; `toLocaleString()` display |
| Cache keys | `deals::board` (full board), `deals::{id}` (individual deal) |
