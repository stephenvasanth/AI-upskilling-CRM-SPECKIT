# Data Model: Activity Logging

**Feature**: `004-activities` | **Date**: 2026-06-16

> Introduces: `Activity` entity, `ActivityType` enum.
> Migration continues from V6 (deals).

---

## Enum: ActivityType

```java
public enum ActivityType {
    CALL,
    EMAIL,
    MEETING,
    NOTE
}
```

Stored as `VARCHAR(10)` in the database.

---

## Entity: Activity

| Field | Java Type | DB Column | Constraints |
|-------|-----------|-----------|-------------|
| `id` | `String` | `id` | PK, `VARCHAR(36)`, UUID |
| `type` | `ActivityType` | `type` | `VARCHAR(10)`, NOT NULL |
| `subject` | `String` | `subject` | `VARCHAR(255)`, NOT NULL |
| `notes` | `String` | `notes` | `TEXT`, nullable |
| `activityDate` | `Instant` | `activity_date` | `TIMESTAMPTZ`, NOT NULL, defaults to `now()` |
| `authorId` | `String` | `author_id` | FK → `users.id`, NOT NULL, `ON DELETE SET NULL` |
| `contactId` | `String` | `contact_id` | FK → `contacts.id`, nullable, `ON DELETE CASCADE` |
| `dealId` | `String` | `deal_id` | FK → `deals.id`, nullable, `ON DELETE SET NULL` |
| `createdAt` | `Instant` | `created_at` | `TIMESTAMPTZ`, NOT NULL |

> `contact_id ON DELETE CASCADE`: when a Contact is hard-deleted, their directly
> linked Activities are also deleted (constitution principle V, CON-04).
> `deal_id ON DELETE SET NULL`: Deal deletion orphans the activity's deal link but
> preserves the activity record.

### JPA Entity

```java
@Entity @Table(name = "activities") @Getter @Setter @NoArgsConstructor
public class Activity {
    @Id @Column(name = "id", length = 36) private String id;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", length = 10, nullable = false)
    private ActivityType type;

    @Column(name = "subject", length = 255, nullable = false) private String subject;
    @Column(name = "notes", columnDefinition = "TEXT")        private String notes;

    @Column(name = "activity_date", nullable = false)
    private Instant activityDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false) private User author;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "contact_id") private Contact contact;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deal_id") private Deal deal;

    @CreationTimestamp @Column(name = "created_at", updatable = false) private Instant createdAt;

    @PrePersist
    private void defaults() {
        if (id == null) id = UUID.randomUUID().toString();
        if (activityDate == null) activityDate = Instant.now();
    }
}
```

### Flyway: V7

```sql
CREATE TABLE IF NOT EXISTS activities (
    id            VARCHAR(36)  PRIMARY KEY,
    type          VARCHAR(10)  NOT NULL,
    subject       VARCHAR(255) NOT NULL,
    notes         TEXT,
    activity_date TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    author_id     VARCHAR(36)  REFERENCES users(id)    ON DELETE SET NULL,
    contact_id    VARCHAR(36)  REFERENCES contacts(id) ON DELETE CASCADE,
    deal_id       VARCHAR(36)  REFERENCES deals(id)    ON DELETE SET NULL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_activities_contact    ON activities (contact_id, activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_activities_deal       ON activities (deal_id,    activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON activities (created_at DESC);
```

---

## DTOs

```java
public record ActivityDto(
    String  id,
    String  type,          // "CALL", "EMAIL", "MEETING", "NOTE"
    String  subject,
    String  notes,
    Instant activityDate,
    String  authorId,
    String  authorName,
    String  contactId,
    String  contactName,   // null if no contact linked
    String  dealId,
    String  dealTitle,     // null if no deal linked
    Instant createdAt
) {}

public record CreateActivityRequest(
    @NotNull                    ActivityType type,
    @NotBlank @Size(max=255)    String subject,
                                String notes,
                                Instant activityDate,  // optional; defaults to now()
                                String contactId,
                                String dealId
) {}

public record ActivityFilterParams(
    ActivityType type,      // optional
    String       contactId, // optional
    Instant      dateFrom,  // optional
    Instant      dateTo,    // optional
    int          page       // default 0
) {}
```

---

## Redis Cache Keys

| Key | Value | TTL | Invalidated on |
|-----|-------|-----|----------------|
| `activities::contact::{id}::page::{n}` | `Page<ActivityDto>` | 24 h | Any activity write for that contact |
| `activities::deal::{id}::page::{n}` | `Page<ActivityDto>` | 24 h | Any activity write for that deal |
| `activities::global::page::{n}` | `Page<ActivityDto>` | 24 h | Any activity create/delete |

> `@CacheEvict(value = "activities-contact", allEntries = true)` is used on
> create/delete to evict all pages of the affected contact's feed at once.
