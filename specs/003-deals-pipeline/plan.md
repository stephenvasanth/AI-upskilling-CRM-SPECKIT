# Implementation Plan: Deals Pipeline

**Branch**: `003-deals-pipeline` | **Date**: 2026-06-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/003-deals-pipeline/spec.md`
**Depends on**: `001-auth`, `002-contacts` (Contact entity for deal link)

---

## Summary

Implement the Kanban-based Deals Pipeline. A drag-and-drop board (Angular CDK
`DragDrop`) shows all deals grouped across 6 fixed stages. Optimistic UI applies
immediately on drag — the deal's stage signal updates in the Angular component
before the server responds; on error the board state reverts and a toast fires.
Create/Edit and Delete are handled via a 400 px right-slide drawer. Column totals
(count + value) are computed client-side from the cached board state.

---

## Technical Context

**Stack**: Java 21 + Spring Boot 3.3 (`crm-service/`) · Angular 20 + CDK (`crm-ui/`)
**New files added to**:
- `crm-service/`: `DealController`, `DealService`, `DealRepository`, `Deal` entity
- `crm-ui/`: `deals/` module (board, card, drawer components)
- Flyway: `V6__create_deals_table.sql`

**Key dependencies**:
- `001-auth`: JWT filter, User entity (owner), error envelope
- `002-contacts`: Contact entity (optional deal link)
- `@angular/cdk/drag-drop` for Kanban column drag-and-drop

**Performance goals**:
- Board loads within 1 second (SC-001)
- Card moves within 200 ms of drag release (optimistic — no server wait)

**Constraints**:
- 6 fixed stages: `LEAD, QUALIFIED, PROPOSAL, NEGOTIATION, CLOSED_WON, CLOSED_LOST`
- Stage order is enforced in frontend config, not DB constraints
- Closed Lost cards render at `opacity: 0.6`
- Deal delete does NOT cascade to Activities or Tasks (records orphaned/retain dealId)
- Value is stored as `NUMERIC(15,2)` (single currency; no multi-currency)

---

## Constitution Check

| Principle | Requirement | Status |
|-----------|-------------|--------|
| I. Spec-Driven | `spec.md` approved; 001-auth + 002-contacts complete | ✅ |
| II. Security by Default | All `/api/deals/**` require JWT | ✅ |
| III. API Contract Integrity | `deals::board` cached in Redis; invalidated on create/update/delete | ✅ |
| IV. Design System Fidelity | Kanban board, cards, drawer match `docs/DESIGN.md` §5 & §6 | ✅ |
| V. Data Integrity | Deal deletion is permanent; Tasks/Activities retain deal reference | ✅ |
| VI. Scope Discipline | No multi-currency; desktop-only; fixed stages | ✅ |
| VII. Roles & Permissions | Both USER and ADMIN have full Deal CRUD | ✅ |

---

## Project Structure — New Files

### crm-service additions
```text
src/main/java/com/aicrm/
└── module/
    └── deal/
        ├── Deal.java
        ├── DealStage.java           # enum: LEAD, QUALIFIED, PROPOSAL, ...
        ├── DealRepository.java
        ├── DealService.java
        ├── DealController.java
        └── dto/
            ├── DealDto.java
            ├── DealBoardDto.java    # { stages: { LEAD: DealDto[], ... } }
            ├── CreateDealRequest.java
            ├── UpdateDealRequest.java
            └── MoveStageRequest.java
resources/db/migration/
└── V6__create_deals_table.sql
```

### crm-ui additions
```text
src/app/modules/deals/
├── deals.routes.ts
├── deal-board/
│   ├── deal-board.component.ts     # CdkDropListGroup host
│   ├── deal-board.component.html
│   └── deal-board.component.css
├── deal-column/
│   ├── deal-column.component.ts    # CdkDropList per stage
│   ├── deal-column.component.html
│   └── deal-column.component.css
├── deal-card/
│   ├── deal-card.component.ts      # CdkDrag; opacity 0.6 if CLOSED_LOST
│   ├── deal-card.component.html
│   └── deal-card.component.css
└── deal-drawer/
    ├── deal-drawer.component.ts    # create + edit via DrawerComponent
    ├── deal-drawer.component.html
    └── deal-drawer.component.css
```

---

## Complexity Tracking

| Item | Complexity driver | Mitigation |
|------|-------------------|------------|
| Optimistic drag revert | Board state must snapshot before drag starts | Store pre-drag `signal<DealBoardDto>` snapshot; restore on HTTP error |
