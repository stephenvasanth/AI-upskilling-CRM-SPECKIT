# Data Model: Deals Pipeline

**Feature**: `003-deals-pipeline` | **Date**: 2026-06-16

> Introduces: `Deal` entity, `DealStage` enum.
> Migration continues from V5 (contact_tags).

---

## Enum: DealStage

Fixed pipeline stages in order:

```java
public enum DealStage {
    LEAD,
    QUALIFIED,
    PROPOSAL,
    NEGOTIATION,
    CLOSED_WON,
    CLOSED_LOST
}
```

Stored as `VARCHAR(20)` in the database. Frontend defines the display order via the constant array `STAGE_ORDER`.

---

## Entity: Deal

| Field | Java Type | DB Column | Constraints |
|-------|-----------|-----------|-------------|
| `id` | `String` | `id` | PK, `VARCHAR(36)`, UUID |
| `title` | `String` | `title` | `VARCHAR(255)`, NOT NULL |
| `value` | `BigDecimal` | `value` | `NUMERIC(15,2)`, nullable (0 if blank) |
| `stage` | `DealStage` | `stage` | `VARCHAR(20)`, NOT NULL, default `'LEAD'` |
| `expectedCloseDate` | `LocalDate` | `expected_close_date` | `DATE`, nullable |
| `contactId` | `String` | `contact_id` | FK → `contacts.id`, nullable, `ON DELETE SET NULL` |
| `ownerId` | `String` | `owner_id` | FK → `users.id`, nullable, `ON DELETE SET NULL` |
| `notes` | `String` | `notes` | `TEXT`, nullable |
| `createdAt` | `Instant` | `created_at` | `TIMESTAMPTZ`, NOT NULL |
| `updatedAt` | `Instant` | `updated_at` | `TIMESTAMPTZ`, NOT NULL |

### JPA Entity

```java
@Entity @Table(name = "deals") @Getter @Setter @NoArgsConstructor
public class Deal {
    @Id @Column(name = "id", length = 36) private String id;

    @Column(name = "title", length = 255, nullable = false) private String title;

    @Column(name = "value", precision = 15, scale = 2)
    private BigDecimal value;

    @Enumerated(EnumType.STRING)
    @Column(name = "stage", length = 20, nullable = false)
    private DealStage stage = DealStage.LEAD;

    @Column(name = "expected_close_date") private LocalDate expectedCloseDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contact_id") private Contact contact;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id") private User owner;

    @Column(name = "notes", columnDefinition = "TEXT") private String notes;

    @CreationTimestamp @Column(name = "created_at", updatable = false) private Instant createdAt;
    @UpdateTimestamp   @Column(name = "updated_at")                    private Instant updatedAt;

    @PrePersist
    private void generateId() { if (id == null) id = UUID.randomUUID().toString(); }
}
```

### Flyway: V6

```sql
CREATE TABLE IF NOT EXISTS deals (
    id                  VARCHAR(36)    PRIMARY KEY,
    title               VARCHAR(255)   NOT NULL,
    value               NUMERIC(15, 2) DEFAULT 0,
    stage               VARCHAR(20)    NOT NULL DEFAULT 'LEAD',
    expected_close_date DATE,
    contact_id          VARCHAR(36)    REFERENCES contacts(id) ON DELETE SET NULL,
    owner_id            VARCHAR(36)    REFERENCES users(id)    ON DELETE SET NULL,
    notes               TEXT,
    created_at          TIMESTAMPTZ    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMPTZ    NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_deals_stage   ON deals (stage);
CREATE INDEX IF NOT EXISTS idx_deals_owner   ON deals (owner_id);
CREATE INDEX IF NOT EXISTS idx_deals_contact ON deals (contact_id);
```

---

## DTOs

```java
public record DealDto(
    String     id,
    String     title,
    BigDecimal value,
    String     stage,           // "LEAD", "QUALIFIED", etc.
    LocalDate  expectedCloseDate,
    String     contactId,
    String     contactName,
    String     ownerId,
    String     ownerName,
    String     notes,
    Instant    createdAt,
    Instant    updatedAt
) {}

// Board payload: one list per stage
public record DealBoardDto(
    Map<String, List<DealDto>> stages   // key = stage name, value = cards in order
) {}

public record CreateDealRequest(
    @NotBlank @Size(max=255) String    title,
    @NotNull                 DealStage stage,
                             BigDecimal value,
                             LocalDate  expectedCloseDate,
                             String     contactId,
                             String     ownerId,
                             String     notes
) {}

public record MoveStageRequest(
    @NotNull DealStage stage
) {}
```

---

## Redis Cache Keys

| Key | Value | TTL | Invalidated on |
|-----|-------|-----|----------------|
| `deals::board` | `DealBoardDto` | 24 h | Any deal create/update/delete/stage-move |
| `deals::{id}` | `DealDto` | 24 h | Update/delete of that deal |

---

## State Transitions

```
[Create → LEAD (default)]
        ↓
  [Drag to any stage]  ← optimistic; reverts on server error
        ↓
   CLOSED_WON or CLOSED_LOST  ← card muted at opacity 0.6 if CLOSED_LOST
        ↓
      [Delete]  ← removes Deal only; Activities/Tasks retain deal reference
```
