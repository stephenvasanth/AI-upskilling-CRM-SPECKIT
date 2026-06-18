# Data Model: Admin — User & Tag Management

**Feature**: `007-admin` | **Date**: 2026-06-16

> No new Flyway migrations — `User` entity is from V1 (001-auth); `Tag` entity and
> `contact_tags` join table are from V4/V5 (002-contacts). This module adds service
> and controller logic on top of existing tables.

---

## Entity: User (extensions for admin operations)

The `User` entity is defined in `001-auth`. Admin operations use the same entity
but through `UserAdminService` rather than `AuthService`. Additional DTO shapes
are added for admin-specific views.

### Admin DTOs

```java
// Full user record shown in the Users management table
public record UserAdminDto(
    String  id,
    String  email,
    String  displayName,
    String  role,        // "USER" or "ADMIN"
    String  status,      // "ACTIVE" or "INACTIVE"
    Instant createdAt
) {}

// Create new user
public record CreateUserRequest(
    @NotBlank @Email @Size(max=255) String email,
    @NotBlank @Size(max=100)        String displayName,
    @NotBlank @Size(min=8)          String initialPassword,
    @NotNull                        Role   role
) {}

// Change role
public record UpdateUserRoleRequest(
    @NotNull Role role
) {}

// Deactivate / reactivate
public record UpdateUserStatusRequest(
    @NotNull Status status
) {}
```

---

## Entity: Tag (admin CRUD operations)

Tag entity is defined in `002-contacts/data-model.md`. Admin operations add full CRUD.

### Tag DTOs

```java
public record TagDto(
    String  id,
    String  name,
    String  colour,       // hex e.g. "#3B82F6"
    long    contactCount, // number of contacts assigned this tag
    Instant createdAt
) {}

public record CreateTagRequest(
    @NotBlank @Size(max=100) String name,
    @NotBlank @Pattern(regexp = "^#[0-9A-Fa-f]{6}$") String colour
) {}
```

---

## Key Business Rules Enforced in Service Layer

| Rule | Enforcement location | Error returned |
|------|---------------------|----------------|
| Admin cannot deactivate themselves | `UserAdminService.deactivate()` — compare `targetId` vs `principal.getId()` | `400 BAD_REQUEST { code: "SELF_DEACTIVATION" }` |
| Last Admin cannot be deactivated or demoted | `UserAdminService` — `COUNT(role=ADMIN, status=ACTIVE) > 1` check | `409 CONFLICT { code: "LAST_ADMIN" }` |
| Email must be unique | DB unique index; `DataIntegrityViolationException` → `409 CONFLICT { code: "CONFLICT" }` | |
| Tag delete cascades to `contact_tags` | DB `ON DELETE CASCADE` on `contact_tags.tag_id` | — |

---

## Repositories (no new interfaces needed)

`UserAdminService` reuses `UserRepository` from `001-auth`.
`TagService` uses `TagRepository` (defined in `002-contacts`):

```java
public interface TagRepository extends JpaRepository<Tag, String> {
    // Count contacts per tag (for display in Tags table)
    @Query("SELECT t.id, COUNT(c.id) FROM Tag t LEFT JOIN t.contacts c GROUP BY t.id")
    List<Object[]> countContactsPerTag();
}
```

---

## Redis Cache Keys

| Key | Value | TTL | Invalidated on |
|-----|-------|-----|----------------|
| `users::list` | `List<UserAdminDto>` | 24 h | Any user create/update-role/deactivate |
| `users::{id}` | `UserAdminDto` | 24 h | Role or status change for that user |
| `tags::list` | `List<TagDto>` | 24 h | Tag create/delete |
