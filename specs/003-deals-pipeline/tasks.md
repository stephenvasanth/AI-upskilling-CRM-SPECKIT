# Tasks: Deals Pipeline

**Input**: Design documents from `specs/003-deals-pipeline/`

**Prerequisites**: spec.md ✅ · plan.md ✅ · data-model.md ✅ · research.md ✅ · quickstart.md ✅

**Depends on**: `001-auth` complete · `002-contacts` complete (Contact entity required for Deal FK)

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

---

## Phase 1: Setup

**Purpose**: Flyway migration and entity scaffolding for the deals domain.

- [X] T001 Create `V6__create_deals_table.sql` Flyway migration in `crm-service/src/main/resources/db/migration/` (idempotent, FK to contacts ON DELETE SET NULL, FK to users ON DELETE SET NULL, indexes on stage/owner_id/contact_id)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core entity, repository, DTOs, and Angular module skeleton. Required before any user story.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T002 Create `DealStage.java` enum (`LEAD, QUALIFIED, PROPOSAL, NEGOTIATION, CLOSED_WON, CLOSED_LOST`) in `crm-service/src/main/java/com/aicrm/module/deal/`
- [X] T003 Create `Deal.java` JPA entity (with ManyToOne Contact/User FKs, DealStage enum, NUMERIC value, LocalDate closeDate) in `crm-service/src/main/java/com/aicrm/module/deal/`
- [X] T004 Create `DealRepository.java` (JpaRepository with `findAllByStageIn`, `findAllGroupedByStage`) in `crm-service/src/main/java/com/aicrm/module/deal/`
- [X] T005 [P] Create `DealDto.java`, `DealBoardDto.java`, `CreateDealRequest.java`, `UpdateDealRequest.java`, `MoveStageRequest.java` in `crm-service/src/main/java/com/aicrm/module/deal/dto/`
- [X] T006 Create Angular `deals.routes.ts` and register in `crm-ui/src/app/app.routes.ts` (lazy-loaded)
- [X] T007 [P] Create Angular `DealsService` (getBoard, createDeal, updateDeal, moveDeal, deleteDeal) in `crm-ui/src/app/modules/deals/deals.service.ts`
- [X] T008 [P] Define `STAGE_ORDER` constant array (display order for columns) in `crm-ui/src/app/modules/deals/deal-board/deal-board.component.ts`

**Checkpoint**: Deal entity compiles; migration runs; Angular module loads.

---

## Phase 3: User Story 1 — View the Pipeline Board (Priority: P1) 🎯 MVP

**Goal**: Users see all deals as a Kanban board with 6 columns, deal count + total value per column header, and Closed Lost cards visually muted.

**Independent Test**: With deals in multiple stages, open `/deals` → verify 6 columns in fixed order → verify column headers show count + value → verify Closed Lost cards render at opacity 0.6.

### Implementation for User Story 1

- [X] T009 [US1] Create `DealService.java` (`getBoardGroupedByStage` with `@Cacheable("deals::board")`) in `crm-service/src/main/java/com/aicrm/module/deal/`
- [X] T010 [US1] Create `DealController.java` (`GET /api/deals/board` returning `DealBoardDto`) in `crm-service/src/main/java/com/aicrm/module/deal/`
- [X] T011 [US1] Create `DealBoardComponent` (`CdkDropListGroup` host, loads board data, renders columns via `STAGE_ORDER`) in `crm-ui/src/app/modules/deals/deal-board/`
- [X] T012 [US1] Create `DealColumnComponent` (`CdkDropList` per stage, shows stage name + deal count + total value in header) in `crm-ui/src/app/modules/deals/deal-column/`
- [X] T013 [US1] Create `DealCardComponent` (`CdkDrag`, displays title + value + contact name; `opacity: 0.6` binding when stage is `CLOSED_LOST`) in `crm-ui/src/app/modules/deals/deal-card/`
- [X] T014 [US1] Register `/deals` route in `crm-ui/src/app/modules/deals/deals.routes.ts`

**Checkpoint**: `/deals` shows 6-column Kanban board with all deals. Column totals correct. Closed Lost cards visually muted.

---

## Phase 4: User Story 2 — Create a Deal (Priority: P1)

**Goal**: Users can click "New Deal", fill in title and stage (required), and see the card appear in the correct column.

**Independent Test**: Click "New Deal" → fill title and stage → save → verify card appears in correct column → verify column count and value update.

### Implementation for User Story 2

- [X] T015 [US2] Add `create(request)` to `DealService.java` (persists deal, `@CacheEvict("deals::board")`) in `crm-service/src/main/java/com/aicrm/module/deal/`
- [X] T016 [US2] Add `POST /api/deals` to `DealController.java` (returns 201 + `DealDto`)
- [X] T017 [US2] Create `DealDrawerComponent` (400px right-slide drawer, create mode: title/value/stage/close-date/contact-picker/owner-picker/notes fields, inline validation) in `crm-ui/src/app/modules/deals/deal-drawer/`
- [X] T018 [US2] Wire "New Deal" button in `DealBoardComponent` (T011) to open `DealDrawerComponent` in create mode; on save, refresh board signal

**Checkpoint**: New deal created via drawer appears in correct column; column count and total value update.

---

## Phase 5: User Story 3 — Move a Deal Between Stages (Priority: P1)

**Goal**: Drag a deal card to a new column — move applies immediately (optimistic); reverts with toast if server fails.

**Independent Test**: Drag "Lead" card to "Qualified" → card moves immediately → column counts update. Simulate 500 error → card reverts to original column → error toast appears.

### Implementation for User Story 3

- [X] T019 [US3] Add `moveStage(id, request)` to `DealService.java` (`@CacheEvict("deals::board")`) in `crm-service/src/main/java/com/aicrm/module/deal/`
- [X] T020 [US3] Add `PATCH /api/deals/{id}/stage` to `DealController.java` (accepts `MoveStageRequest`, returns updated `DealDto`)
- [X] T021 [US3] Implement drag-and-drop in `DealBoardComponent` (T011): on `cdkDropListDropped` → snapshot board state signal → optimistically update local board signal → call `DealsService.moveDeal()` → on error: restore snapshot + fire toast

**Checkpoint**: Drag-and-drop moves cards instantly. Server failure reverts the card and shows a toast. Closed Lost visual muting toggles correctly when card moves in/out.

---

## Phase 6: User Story 4 — Edit a Deal (Priority: P2)

**Goal**: Clicking a deal card opens the drawer with all fields pre-populated; saving updates the card and column totals.

**Independent Test**: Click a deal card → verify drawer opens with current values → change value → save → verify updated value on card and column total.

### Implementation for User Story 4

- [X] T022 [US4] Add `getById(id)` to `DealService.java` (`@Cacheable("deals::{id}")`) in `crm-service/src/main/java/com/aicrm/module/deal/`
- [X] T023 [US4] Add `GET /api/deals/{id}` and `PUT /api/deals/{id}` to `DealController.java` (PUT with `@CacheEvict` on `deals::{id}` + `deals::board`)
- [X] T024 [US4] Extend `DealDrawerComponent` (T017) to support edit mode: pre-populate from `DealDto`, submit to `PUT /api/deals/{id}`
- [X] T025 [US4] Wire `DealCardComponent` (T013) click to open `DealDrawerComponent` in edit mode; on save, refresh board signal

**Checkpoint**: Deal edit persists; card value and column total update immediately on save.

---

## Phase 7: User Story 5 — Delete a Deal (Priority: P2)

**Goal**: User can delete a deal (with confirmation); card disappears and column totals update.

**Independent Test**: Open a deal drawer → click Delete → confirm → verify card removed → column count and value decrease.

### Implementation for User Story 5

- [X] T026 [US5] Add `delete(id)` to `DealService.java` (`@CacheEvict` on `deals::{id}` + `deals::board`) in `crm-service/src/main/java/com/aicrm/module/deal/`
- [X] T027 [US5] Add `DELETE /api/deals/{id}` to `DealController.java` (returns 204)
- [X] T028 [US5] Add Delete button + `ModalComponent` confirmation to `DealDrawerComponent` (T017); on confirm, call `DealsService.deleteDeal()`, close drawer, refresh board signal

**Checkpoint**: Confirmed deletion removes deal card from board; column counts and totals update correctly.

---

## Phase 8: Polish & Cross-Cutting Concerns

- [X] T029 [P] Write `DealServiceTest.java` (Mockito: getBoardGroupedByStage, create, moveStage, update, delete) in `crm-service/src/test/java/com/aicrm/deal/`
- [X] T030 [P] Write `DealControllerTest.java` (@SpringBootTest slice — all endpoints) in `crm-service/src/test/java/com/aicrm/deal/`
- [X] T031 Run quickstart.md validation scenarios end-to-end (board load, drag, create, edit, delete)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Migration)**: Depends on V5 (contact_tags) from `002-contacts`
- **Phase 2 (Foundational)**: Depends on Phase 1
- **Phase 3 (US1 Board)**: Depends on Phase 2
- **Phase 4 (US2 Create)**: Depends on Phase 3 (DealBoard + DealColumn + DealCard components exist)
- **Phase 5 (US3 Drag)**: Depends on Phase 3 (board must render before drag works)
- **Phase 6 (US4 Edit)**: Depends on Phase 4 (DealDrawer component exists)
- **Phase 7 (US5 Delete)**: Depends on Phase 6 (DealDrawer with edit mode)
- **Phase 8 (Polish)**: Depends on Phases 3–7

### Parallel Opportunities

- T005 + T006 + T007 + T008: DTOs + Angular scaffolding simultaneously
- T009 + T011 + T012 + T013: Backend service + frontend components (different files)
- T015 + T017: Backend create + frontend drawer component
- T019 + T021: Backend moveStage + frontend drag logic
- T029 + T030: Both test classes simultaneously

---

## Parallel Example: User Story 1

```bash
# Parallel group — different files, no interdependencies:
Task T009: DealService.getBoardGroupedByStage in crm-service/
Task T011: DealBoardComponent skeleton in crm-ui/
Task T012: DealColumnComponent in crm-ui/
Task T013: DealCardComponent in crm-ui/

# Sequential:
Task T010: DealController GET /api/deals/board (depends on T009 DealService)
# Wire components together after individual components compile
```

---

## Implementation Strategy

### MVP First (US1 View Board)

1. Complete Phase 1: Migration
2. Complete Phase 2: Foundational
3. Complete Phase 3: US1 View Board
4. **STOP and VALIDATE**: Board renders all deals in correct columns; column totals correct
5. Continue US2 (Create) → US3 (Drag) → US4 (Edit) → US5 (Delete)

### Incremental Delivery

1. Migration + Entities → DB schema ready
2. US1 → Board renders correctly (read-only)
3. US2 → Create via drawer
4. US3 → Drag-and-drop with optimistic update and revert
5. US4 → Edit via drawer
6. US5 → Delete with confirmation

---

## Notes

- `[P]` tasks have no file conflicts — safe to run concurrently
- Optimistic drag (US3) requires snapshotting the full `DealBoardDto` signal before updating; restore on HTTP error
- Column totals (count + value) are computed client-side from the local board signal — no separate API call
- Value is `NUMERIC(15,2)` — use `BigDecimal` on the backend; format as currency string in Angular
- Deal delete does NOT cascade to Activities or Tasks (those records retain their `dealId` reference)
- `@angular/cdk/drag-drop` must be imported in the Angular module (already a dependency from 001-auth CDK setup)
