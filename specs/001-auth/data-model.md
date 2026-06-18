# Data Model: Authentication & User Management

**Feature**: `001-auth` | **Date**: 2026-06-16

> This file defines the `User` entity established by the auth module using JPA
> annotations (Java 21 + Hibernate 6.4 / Spring Data JPA). The full schema
> accumulates entities from all 7 modules — relation fields for other modules are
> noted here but mapped when those modules are planned.

---

## Entity: User

The central actor in the system. Every authenticated action is performed by a
User. Roles and activation status are managed by Admins (module 007-admin).

### Fields

| Field | Java Type | DB Column | Constraints | Notes |
|-------|-----------|-----------|-------------|-------|
| `id` | `String` | `id` | PK, `VARCHAR(36)`, `gen_random_uuid()` | UUID v4, opaque stable identifier |
| `email` | `String` | `email` | `VARCHAR(255)`, UNIQUE, NOT NULL | Login credential; lowercase-normalised on write |
| `displayName` | `String` | `display_name` | `VARCHAR(100)`, NOT NULL | Shown in sidebar, activity feed, task assignee |
| `passwordHash` | `String` | `password_hash` | `VARCHAR(255)`, NOT NULL | BCrypt hash (cost 10); NEVER returned in API responses |
| `role` | `Role` (enum) | `role` | `VARCHAR(10)`, NOT NULL, default `'USER'` | `USER` or `ADMIN` |
| `status` | `Status` (enum) | `status` | `VARCHAR(10)`, NOT NULL, default `'ACTIVE'` | `ACTIVE` or `INACTIVE` |
| `createdAt` | `Instant` | `created_at` | `TIMESTAMPTZ`, NOT NULL, default `CURRENT_TIMESTAMP` | Set once on insert |
| `updatedAt` | `Instant` | `updated_at` | `TIMESTAMPTZ`, NOT NULL | Updated on every write via `@UpdateTimestamp` |

### Enums (Java)

```java
public enum Role   { USER, ADMIN }
public enum Status { ACTIVE, INACTIVE }
```

### Validation Rules

| Rule | Detail |
|------|--------|
| `email` format | RFC 5321; validated via `@Email` + `@NotBlank` on request DTOs |
| `email` uniqueness | Unique index in DB; `DataIntegrityViolationException` → `CONFLICT` error |
| `displayName` length | 1–100 characters; blank string rejected via `@NotBlank @Size(max=100)` |
| `passwordHash` source | Only set from a BCrypt hash; raw passwords MUST never be stored or logged |
| `password` input min | 8 characters minimum — validated on request DTO before hashing |
| `role` mutation | Only ADMIN users may change another user's role (enforced in 007-admin) |
| `status` mutation | Only ADMIN users may deactivate/reactivate accounts (enforced in 007-admin) |
| `INACTIVE` login | Returns the same generic `AUTH_FAILED` error as wrong credentials |

### Relations (cross-module — added by downstream modules)

| Relation | Java type | Module |
|----------|-----------|--------|
| `ownedContacts` | `List<Contact>` | 002-contacts |
| `ownedDeals` | `List<Deal>` | 003-deals-pipeline |
| `activities` | `List<Activity>` | 004-activities |
| `assignedTasks` | `List<Task>` | 005-tasks |

---

## JPA Entity

```java
// crm-service/src/main/java/com/aicrm/module/user/User.java

package com.aicrm.module.user;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
public class User {

    @Id
    @Column(name = "id", length = 36)
    private String id;

    @Column(name = "email", length = 255, unique = true, nullable = false)
    private String email;

    @Column(name = "display_name", length = 100, nullable = false)
    private String displayName;

    @Column(name = "password_hash", length = 255, nullable = false)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", length = 10, nullable = false)
    private Role role = Role.USER;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 10, nullable = false)
    private Status status = Status.ACTIVE;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false, nullable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    // Relations added by downstream modules (commented until their migrations run):
    // @OneToMany(mappedBy = "owner")
    // private List<Contact> ownedContacts = new ArrayList<>();

    // @OneToMany(mappedBy = "owner")
    // private List<Deal> ownedDeals = new ArrayList<>();

    // @OneToMany(mappedBy = "author")
    // private List<Activity> activities = new ArrayList<>();

    // @OneToMany(mappedBy = "assignee")
    // private List<Task> assignedTasks = new ArrayList<>();

    @PrePersist
    private void generateId() {
        if (this.id == null) {
            this.id = java.util.UUID.randomUUID().toString();
        }
    }
}
```

---

## Flyway Migration

```sql
-- crm-service/src/main/resources/db/migration/V1__create_users_table.sql

CREATE TABLE IF NOT EXISTS users (
    id           VARCHAR(36)  PRIMARY KEY,
    email        VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role         VARCHAR(10)  NOT NULL DEFAULT 'USER',
    status       VARCHAR(10)  NOT NULL DEFAULT 'ACTIVE',
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
```

> `CREATE TABLE IF NOT EXISTS` and `CREATE INDEX IF NOT EXISTS` make the script
> idempotent — safe to re-run on an existing database (constitution principle V).

---

## Spring Data JPA Repository

```java
// crm-service/src/main/java/com/aicrm/module/user/UserRepository.java

package com.aicrm.module.user;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
}
```

---

## DTO Shapes

### UserDto (read-only response — never includes `passwordHash`)

```java
// crm-service/src/main/java/com/aicrm/module/auth/dto/UserDto.java

public record UserDto(
    String  id,
    String  email,
    String  displayName,
    String  role,          // "USER" or "ADMIN"
    String  status,        // "ACTIVE" or "INACTIVE"
    Instant createdAt
) {}
```

### LoginRequest

```java
public record LoginRequest(
    @NotBlank @Email  String email,
    @NotBlank         String password
) {}
```

### LoginResponse

```java
public record LoginResponse(
    String  token,
    UserDto user
) {}
```

### UpdateProfileRequest

```java
public record UpdateProfileRequest(
    @NotBlank @Size(min = 1, max = 100) String displayName
) {}
```

### ChangePasswordRequest

```java
public record ChangePasswordRequest(
    @NotBlank              String currentPassword,
    @NotBlank @Size(min=8) String newPassword
) {}
```

---

## Redis Cache Keys (auth module)

| Key pattern | Value | TTL | Invalidated on |
|-------------|-------|-----|----------------|
| `users::{id}` | `UserDto` JSON | 24 h | `PUT /api/auth/profile`, `PUT /api/auth/password`, deactivation (007-admin) |

> Spring `RedisCacheManager` generates keys as `{cacheName}::{key}` by default.
> Cache name `"users"` + key `#id` → Redis key `users::abc-123`.

---

## State Transitions

### User Status

```
         [Admin creates user]
                 ↓
             ACTIVE
            ↙       ↘
  [Admin deactivates]  [Admin reactivates]
       ↓                    ↑
    INACTIVE ───────────────┘
```

- A deactivated (`INACTIVE`) user cannot log in — same `AUTH_FAILED` response
- Deactivation is a status update, not a hard delete — data is preserved
- The last ADMIN account cannot be deactivated (enforced in `UserService`, 007)

### Session Lifecycle (client-side)

```
[POST /api/auth/login success]
        ↓
token stored in localStorage + AuthService.currentUser signal set
        ↓
[AuthInterceptor] attaches Authorization: Bearer {token} to all requests
        ↓
[Token age > 8 h] → any API call returns 401
        ↓
[ErrorInterceptor] calls authService.clearAuth() → Router navigates /login
        ↓
[User clicks Logout] → authService.clearAuth() → Router navigates /login
```

---

## Seed Data (development only)

One default Admin account is seeded for initial access. Provided via a Flyway
repeatable migration (`R__seed_dev_admin.sql`) so it only runs in `dev` profile:

| Field | Value |
|-------|-------|
| `id` | `00000000-0000-0000-0000-000000000001` |
| `email` | `admin@aicrm.local` |
| `displayName` | `CRM Admin` |
| `password` | `Admin1234!` (BCrypt-hashed at cost 10) |
| `role` | `ADMIN` |
| `status` | `ACTIVE` |
