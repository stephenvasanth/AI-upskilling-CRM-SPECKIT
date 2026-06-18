# API Contracts: Deals Pipeline

**Feature**: `003-deals-pipeline` | **Date**: 2026-06-16
**Base URL**: `/api/deals`
**Auth**: All endpoints require `Authorization: Bearer <token>`

> Error envelope is global — see `001-auth/contracts/auth.md`.

---

### GET /api/deals/board

Returns all deals grouped by stage for the Kanban board. This is the primary board-load endpoint.

**Response 200**
```json
{
  "stages": {
    "LEAD":        [{ "id": "uuid", "title": "Acme deal", "value": 5000.00, "stage": "LEAD", "contactName": "Jane Smith", "ownerName": "CRM Admin", "expectedCloseDate": "2026-09-01" }],
    "QUALIFIED":   [],
    "PROPOSAL":    [],
    "NEGOTIATION": [],
    "CLOSED_WON":  [],
    "CLOSED_LOST": []
  }
}
```

> Cached at `deals::board` TTL 24 h. Invalidated on any deal write.

---

### POST /api/deals

Create a new deal. New deals default to `LEAD` stage if stage not specified.

**Request**
```json
{
  "title": "Acme Enterprise",
  "value": 15000.00,
  "stage": "LEAD",
  "expectedCloseDate": "2026-09-30",
  "contactId": "uuid",
  "ownerId": "uuid",
  "notes": "Key stakeholder is the CFO"
}
```

| Field | Required | Rules |
|-------|----------|-------|
| `title` | ✅ | 1–255 chars |
| `stage` | ✅ | One of the 6 valid `DealStage` values; defaults to `LEAD` |
| `value` | — | Non-negative decimal |
| `expectedCloseDate` | — | ISO date `YYYY-MM-DD` |
| `contactId` | — | Must exist in `contacts` |
| `ownerId` | — | Must exist in `users` |

**Response 201** — `DealDto`

> Evicts `deals::board` on success.

---

### GET /api/deals/{id}

Get a single deal.

**Response 200** — `DealDto`

> Cached at `deals::{id}` TTL 24 h.

**Response 404**
```json
{ "error": { "code": "NOT_FOUND", "message": "Deal not found" } }
```

---

### PUT /api/deals/{id}

Update all deal fields.

**Request** — same shape as POST

**Response 200** — updated `DealDto`

> Evicts `deals::{id}` and `deals::board`.

---

### PATCH /api/deals/{id}/stage

Move a deal to a different stage. Used by the optimistic drag-and-drop.

**Request**
```json
{ "stage": "QUALIFIED" }
```

**Response 200** — updated `DealDto`

> Evicts `deals::board`. The `deals::{id}` cache is also evicted.

---

### DELETE /api/deals/{id}

Delete a deal. Does NOT cascade to Activities or Tasks.

**Response 204** — no body

> Evicts `deals::{id}` and `deals::board`.

---

## Angular Service Contract

```typescript
@Injectable({ providedIn: 'root' })
export class DealsService {
  getBoard(): Observable<DealBoardDto> { ... }
  getDeal(id: string): Observable<DealDto> { ... }
  createDeal(body: CreateDealRequest): Observable<DealDto> { ... }
  updateDeal(id: string, body: UpdateDealRequest): Observable<DealDto> { ... }
  moveDealStage(id: string, stage: DealStage): Observable<DealDto> { ... }
  deleteDeal(id: string): Observable<void> { ... }
}
```

## Angular Board State Contract

```typescript
// Signal-based board state in DealBoardComponent
readonly boardState = signal<DealBoardDto | null>(null);

// On drag drop (cdkDropListDropped):
onDrop(event: CdkDragDrop<DealDto[]>): void {
  const snapshot = this.boardState()!;            // save for revert
  this.boardState.update(applyMove(event));        // optimistic update
  this.dealsService.moveDealStage(id, newStage)
    .pipe(catchError(() => {
      this.boardState.set(snapshot);               // revert
      this.toastService.error('Stage change failed');
      return EMPTY;
    }))
    .subscribe();
}
```
