# Data Model: Contact Management

**Feature**: `002-contacts` | **Date**: 2026-06-16

> Introduces: `Company`, `Contact`, `Tag`, `ContactTag` entities.
> `Tag` entity is defined here but its CRUD lives in `007-admin`.
> Migration numbering continues from `001-auth` (V1 = users).

---

## Entity: Company

Read-only lookup used to populate the company picker on the Contact form.
Full Company management is deferred to a future release.

| Field | Java Type | DB Column | Constraints |
|-------|-----------|-----------|-------------|
| `id` | `String` | `id` | PK, `VARCHAR(36)`, UUID |
| `name` | `String` | `name` | `VARCHAR(255)`, NOT NULL |

### JPA Entity

```java
@Entity @Table(name = "companies") @Getter @Setter @NoArgsConstructor
public class Company {
    @Id @Column(name = "id", length = 36) private String id;
    @Column(name = "name", length = 255, nullable = false) private String name;

    @PrePersist
    private void generateId() { if (id == null) id = UUID.randomUUID().toString(); }
}
```

### Flyway: V2

```sql
CREATE TABLE IF NOT EXISTS companies (
    id   VARCHAR(36)  PRIMARY KEY,
    name VARCHAR(255) NOT NULL
);
```

---

## Entity: Contact

Central entity of the CRM.

| Field | Java Type | DB Column | Constraints |
|-------|-----------|-----------|-------------|
| `id` | `String` | `id` | PK, `VARCHAR(36)`, UUID |
| `firstName` | `String` | `first_name` | `VARCHAR(100)`, NOT NULL |
| `lastName` | `String` | `last_name` | `VARCHAR(100)`, NOT NULL |
| `email` | `String` | `email` | `VARCHAR(255)`, nullable |
| `phone` | `String` | `phone` | `VARCHAR(50)`, nullable |
| `jobTitle` | `String` | `job_title` | `VARCHAR(100)`, nullable |
| `companyId` | `String` | `company_id` | FK → `companies.id`, nullable |
| `ownerId` | `String` | `owner_id` | FK → `users.id`, nullable |
| `createdAt` | `Instant` | `created_at` | `TIMESTAMPTZ`, NOT NULL |
| `updatedAt` | `Instant` | `updated_at` | `TIMESTAMPTZ`, NOT NULL |

### Relations

| Relation | Type | Notes |
|----------|------|-------|
| `company` | `@ManyToOne Company` | optional; `JOIN FETCH` on detail load |
| `owner` | `@ManyToOne User` | optional; FK to `users.id` |
| `tags` | `@ManyToMany Tag` via `contact_tags` | assigned tags |
| `activities` | `@OneToMany Activity` | `ON DELETE CASCADE` (DB level) |
| `tasks` | `@OneToMany Task` | `ON DELETE SET NULL` on `contact_id` (DB level) |

### JPA Entity (abbreviated)

```java
@Entity @Table(name = "contacts") @Getter @Setter @NoArgsConstructor
public class Contact {
    @Id @Column(name = "id", length = 36) private String id;

    @Column(name = "first_name", length = 100, nullable = false) private String firstName;
    @Column(name = "last_name",  length = 100, nullable = false) private String lastName;
    @Column(name = "email",      length = 255)                   private String email;
    @Column(name = "phone",      length = 50)                    private String phone;
    @Column(name = "job_title",  length = 100)                   private String jobTitle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id") private Company company;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")   private User owner;

    @ManyToMany
    @JoinTable(name = "contact_tags",
        joinColumns = @JoinColumn(name = "contact_id"),
        inverseJoinColumns = @JoinColumn(name = "tag_id"))
    private Set<Tag> tags = new HashSet<>();

    @CreationTimestamp @Column(name = "created_at", updatable = false) private Instant createdAt;
    @UpdateTimestamp   @Column(name = "updated_at")                    private Instant updatedAt;

    @PrePersist
    private void generateId() { if (id == null) id = UUID.randomUUID().toString(); }
}
```

### Flyway: V3

```sql
CREATE TABLE IF NOT EXISTS contacts (
    id           VARCHAR(36)  PRIMARY KEY,
    first_name   VARCHAR(100) NOT NULL,
    last_name    VARCHAR(100) NOT NULL,
    email        VARCHAR(255),
    phone        VARCHAR(50),
    job_title    VARCHAR(100),
    company_id   VARCHAR(36)  REFERENCES companies(id) ON DELETE SET NULL,
    owner_id     VARCHAR(36)  REFERENCES users(id)     ON DELETE SET NULL,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_contacts_email     ON contacts (email);
CREATE INDEX IF NOT EXISTS idx_contacts_last_name ON contacts (last_name);
CREATE INDEX IF NOT EXISTS idx_contacts_owner     ON contacts (owner_id);
```

---

## Entity: Tag

Coloured label managed by Admins. Defined here; CRUD in `007-admin`.

| Field | Java Type | DB Column | Constraints |
|-------|-----------|-----------|-------------|
| `id` | `String` | `id` | PK, `VARCHAR(36)`, UUID |
| `name` | `String` | `name` | `VARCHAR(100)`, NOT NULL |
| `colour` | `String` | `colour` | `VARCHAR(7)`, NOT NULL (hex e.g. `#3B82F6`) |
| `createdAt` | `Instant` | `created_at` | `TIMESTAMPTZ`, NOT NULL |

### Flyway: V4

```sql
CREATE TABLE IF NOT EXISTS tags (
    id         VARCHAR(36)  PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    colour     VARCHAR(7)   NOT NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

---

## Join Table: ContactTag

| Column | Type | Constraints |
|--------|------|-------------|
| `contact_id` | `VARCHAR(36)` | FK → `contacts.id` ON DELETE CASCADE |
| `tag_id` | `VARCHAR(36)` | FK → `tags.id` ON DELETE CASCADE |
| PK | composite | `(contact_id, tag_id)` |

### Flyway: V5

```sql
CREATE TABLE IF NOT EXISTS contact_tags (
    contact_id VARCHAR(36) NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    tag_id     VARCHAR(36) NOT NULL REFERENCES tags(id)     ON DELETE CASCADE,
    PRIMARY KEY (contact_id, tag_id)
);
```

---

## DTOs

```java
// Paginated list item
public record ContactSummaryDto(
    String id, String firstName, String lastName,
    String email, String company, List<TagDto> tags, Instant createdAt
) {}

// Full detail
public record ContactDto(
    String id, String firstName, String lastName,
    String email, String phone, String jobTitle,
    String companyId, String companyName,
    String ownerId,   String ownerName,
    List<TagDto> tags, Instant createdAt, Instant updatedAt
) {}

public record CreateContactRequest(
    @NotBlank @Size(max=100) String firstName,
    @NotBlank @Size(max=100) String lastName,
    @Email   @Size(max=255)  String email,
                             String phone,
                             String jobTitle,
                             String companyId,
                             String ownerId,
                             List<String> tagIds
) {}
```

---

## Redis Cache Keys

| Key | Value | TTL | Invalidated on |
|-----|-------|-----|----------------|
| `contacts::list::{page}` | `Page<ContactSummaryDto>` | 24 h | Any contact write |
| `contacts::{id}` | `ContactDto` | 24 h | Update/delete of that contact |
| `companies::list` | `List<CompanyDto>` | 24 h | Company add/remove (future) |
| `tags::list` | `List<TagDto>` | 24 h | Tag create/delete (007-admin) |

---

## State Transitions

```
[Create] → Contact exists
    ↓
[Edit any field] → Contact updated (updatedAt refreshed)
    ↓
[Delete] → Contact + Activities removed; Tasks preserved (contact_id = NULL)
```
