# API Contracts: Authentication & User Management

**Feature**: `001-auth` | **Date**: 2026-06-16
**Base URL**: `/api/auth`
**Content-Type**: `application/json` (all requests and responses)

---

## Error Envelope (global — applies to all modules)

All API errors use this consistent shape, returned by `GlobalExceptionHandler`
(`@RestControllerAdvice` in `crm-service`):

```json
{
  "error": {
    "code": "SNAKE_CASE_CODE",
    "message": "Human-readable description safe to display",
    "fields": {
      "fieldName": "Field-specific validation message"
    }
  }
}
```

- `fields` is only present on **HTTP 422** (Bean Validation errors)
- `code` is a stable string constant from the `ErrorCode` enum — never an HTTP
  status number
- `message` is safe to show to users; never exposes internals, stack traces, or
  SQL errors
- Spring's default HTML error page (`/error`) is disabled via
  `server.error.whitelabel.enabled=false`

### Standard error codes

| Code | HTTP | When |
|------|------|------|
| `AUTH_FAILED` | 401 | Login failed — wrong credentials OR inactive account |
| `UNAUTHORIZED` | 401 | No token or expired/invalid token on a protected route |
| `FORBIDDEN` | 403 | Valid token but insufficient role (`USER` on an `ADMIN` route) |
| `NOT_FOUND` | 404 | Resource does not exist |
| `VALIDATION_ERROR` | 422 | Request body failed `@Valid` Bean Validation |
| `CONFLICT` | 409 | Unique constraint violation (e.g. duplicate email) |
| `INVALID_PASSWORD` | 400 | Current password is incorrect on change-password |
| `INTERNAL_ERROR` | 500 | Unexpected server error (no internals exposed) |

---

## Endpoints

### POST /api/auth/login

Authenticate a user with email and password. Returns a JWT on success.
This is the **only** `/api/*` endpoint that does not require a JWT
(configured `permitAll()` in `SecurityConfig`).

**Request**
```json
{
  "email": "user@example.com",
  "password": "plaintextpassword"
}
```

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `email` | string | ✅ | Valid email format (`@Email` + `@NotBlank`) |
| `password` | string | ✅ | 1–72 chars (BCrypt limit) |

**Response 200 — Success**
```json
{
  "token": "eyJhbGciOiJIUzUxMiJ9...",
  "user": {
    "id": "a3f1c2d4-...",
    "email": "user@example.com",
    "displayName": "Jane Smith",
    "role": "USER"
  }
}
```

> Token is a signed HS512 JWT with 8-hour expiry. The `sub` claim holds the
> user's `id`; the `role` claim holds the role string.

**Response 401 — Invalid credentials OR inactive account**
```json
{
  "error": {
    "code": "AUTH_FAILED",
    "message": "Invalid email or password"
  }
}
```
> Both wrong password AND inactive account return **identical** `AUTH_FAILED`
> responses — no enumeration hint (constitution principle II).

**Response 422 — Validation error**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "fields": {
      "email": "Must be a valid email address"
    }
  }
}
```

---

### GET /api/auth/me

Return the authenticated user's profile. Used on app load to hydrate Angular's
`AuthService` and on the Profile page to display current values.

**Headers**: `Authorization: Bearer <token>` (required)

> This endpoint is cache-first: `UserService.getById()` is annotated
> `@Cacheable(value = "users", key = "#id")`. Cache hit → return Redis value;
> cache miss → query PostgreSQL, populate Redis (TTL 24 h), return.

**Response 200 — Success**
```json
{
  "id": "a3f1c2d4-...",
  "email": "user@example.com",
  "displayName": "Jane Smith",
  "role": "USER",
  "status": "ACTIVE",
  "createdAt": "2026-06-16T10:00:00.000Z"
}
```

**Response 401 — Missing, expired, or invalid token**
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

---

### PUT /api/auth/profile

Update the authenticated user's display name.

**Headers**: `Authorization: Bearer <token>` (required)

**Request**
```json
{
  "displayName": "Jane Smith"
}
```

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `displayName` | string | ✅ | 1–100 characters, `@NotBlank @Size(max=100)` |

**Response 200 — Success**
```json
{
  "id": "a3f1c2d4-...",
  "email": "user@example.com",
  "displayName": "Jane Smith",
  "role": "USER"
}
```

**Response 422 — Validation error**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "fields": {
      "displayName": "Display name must be between 1 and 100 characters"
    }
  }
}
```

> On success, `@CacheEvict(value = "users", key = "#userId")` immediately
> invalidates the Redis cache key `users::{id}`.

---

### PUT /api/auth/password

Change the authenticated user's password. Requires the current password for
verification before accepting the new one.

**Headers**: `Authorization: Bearer <token>` (required)

**Request**
```json
{
  "currentPassword": "OldPassword123",
  "newPassword": "NewPassword456"
}
```

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `currentPassword` | string | ✅ | Must match stored BCrypt hash |
| `newPassword` | string | ✅ | Minimum 8 characters (`@Size(min=8)`) |

**Response 200 — Success**
```json
{
  "message": "Password updated successfully"
}
```

**Response 400 — Current password incorrect**
```json
{
  "error": {
    "code": "INVALID_PASSWORD",
    "message": "Current password is incorrect"
  }
}
```

**Response 422 — New password too short**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "fields": {
      "newPassword": "Password must be at least 8 characters"
    }
  }
}
```

> On success, `@CacheEvict(value = "users", key = "#userId")` invalidates the
> Redis cache. The existing JWT remains valid until its 8 h natural expiry —
> no forced re-login on password change in this release.

---

## Frontend Auth Service Contract (Angular 20)

`AuthService` (`providedIn: 'root'`) maintains this state using Angular signals:

```typescript
// crm-ui/src/app/core/services/auth.service.ts

export interface AuthUser {
  id:          string;
  email:       string;
  displayName: string;
  role:        'USER' | 'ADMIN';
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  // Reactive signal — read anywhere as currentUser()
  readonly currentUser = signal<AuthUser | null>(null);

  // Derived signals
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly isAdmin         = computed(() => this.currentUser()?.role === 'ADMIN');

  constructor(private http: HttpClient, private router: Router) {
    this.hydrateFromStorage(); // restore from localStorage on app load
  }

  login(email: string, password: string): Observable<void> { ... }
  logout(): void { ... }      // clearAuth() + navigate('/login')
  clearAuth(): void { ... }   // called by ErrorInterceptor on 401/403
}
```

**Token lifecycle**:
1. Login success → `localStorage.setItem('token', jwt)` + `currentUser.set(user)`
2. App reload → `AuthService` reads `localStorage`, validates JWT expiry, restores
   `currentUser` signal if token is still valid
3. Every outgoing HTTP request → `AuthInterceptor` appends
   `Authorization: Bearer {token}` header
4. 401 / 403 response → `ErrorInterceptor` calls `authService.clearAuth()` →
   `Router.navigate(['/login'])`
5. Logout click → `authService.logout()` → `localStorage.removeItem('token')` +
   `currentUser.set(null)` → `Router.navigate(['/login'])`

---

## Angular Route Guard Contract

### `authGuard` (`CanActivateFn`)

Applied to all routes except `/login`:

```typescript
export const authGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  return auth.isAuthenticated()
    ? true
    : router.createUrlTree(['/login']);
};
```

### `adminGuard` (`CanActivateFn`)

Applied additionally to `/admin/**` routes:

```typescript
export const adminGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  return auth.isAdmin()
    ? true
    : router.createUrlTree(['/dashboard']);
};
```

---

## CORS Configuration

Configured in `SecurityConfig.java` via `CorsConfigurationSource`:

| Setting | Value |
|---------|-------|
| Allowed origin | `FRONTEND_ORIGIN` environment variable (e.g. `http://localhost:3000`) |
| Allowed methods | `GET, POST, PUT, DELETE, OPTIONS` |
| Allowed headers | `Authorization, Content-Type` |
| Allow credentials | `true` |
| Max age | `3600` seconds |

> `OPTIONS` preflight requests are permitted without authentication.
