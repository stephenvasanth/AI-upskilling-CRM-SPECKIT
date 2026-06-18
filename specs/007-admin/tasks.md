# Tasks: Admin — User & Tag Management

**Input**: Design documents from `specs/007-admin/`

**Prerequisites**: spec.md ✅ · plan.md ✅ · research.md ✅ · quickstart.md ✅

**Depends on**: `001-auth` (User entity, JWT, BCrypt) · `002-contacts` (Tag entity, TagRepository, contact_tags table)

**Organization**: Tasks grouped by user story to enable independent implementation and testing.

---

## Phase 1: Setup

**Purpose**: Angular admin module skeleton. No new Flyway migrations (Tag and contact_tags already exist from `002-contacts` V4/V5).

- [X] T001 Create Angular `admin.routes.ts` (`canActivate: [adminGuard]`; lazy-loaded routes for `/users` and `/tags`) and register in `crm-ui/src/app/app.routes.ts`
- [X] T002 [P] Update `SidebarComponent` (`001-auth`) to show "Users" and "Tags" nav items only when `isAdmin()` signal is true (links to `/users` and `/tags`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Backend admin service infrastructure and shared DTOs.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T003 Create `CreateUserRequest.java`, `UpdateUserRoleRequest.java`, `UpdateUserStatusRequest.java` DTOs in `crm-service/src/main/java/com/aicrm/module/admin/dto/`
- [X] T004 Create `UserAdminService.java` (listAll, createUser with BCrypt hash, updateRole with last-admin guard, updateStatus with self-deactivation guard) in `crm-service/src/main/java/com/aicrm/module/admin/`
- [X] T005 Create `UserAdminController.java` (all `/api/admin/users/**` endpoints; `@PreAuthorize("hasRole('ADMIN')")` on class) in `crm-service/src/main/java/com/aicrm/module/admin/`
- [X] T006 [P] Create Angular `AdminUsersService` (listUsers, createUser, updateRole, updateStatus) in `crm-ui/src/app/modules/admin/admin-users.service.ts`

**Checkpoint**: Admin user endpoints compile; `@PreAuthorize` rejects non-admin calls with 403.

---

## Phase 3: User Story 1 — Invite a New Team Member (Priority: P1) 🎯 MVP

**Goal**: Admin can create a new user (name, email, initial password, role). New user appears in the Users table and can log in immediately.

**Independent Test**: Log in as Admin → navigate to `/users` → click "Invite User" → fill in name, email, password, role → save → verify user in table → log out → log in as new user → verify access matches assigned role.

### Implementation for User Story 1

- [X] T007 [US1] Implement `UserAdminService.createUser()`: validate unique email (409 on conflict), BCrypt-hash password, persist User with ACTIVE status, `@CacheEvict("users")`) in `crm-service/src/main/java/com/aicrm/module/admin/`
- [X] T008 [US1] Add `POST /api/admin/users` to `UserAdminController.java` (returns 201 + `UserDto`)
- [X] T009 [US1] Add `GET /api/admin/users` to `UserAdminController.java` (returns all users, `@Cacheable("users::list")`)
- [X] T010 [US1] Create `UsersComponent` (Users table: name, email, role badge, status badge, joined date; "Invite User" button opens `CreateUserDrawerComponent`) in `crm-ui/src/app/modules/admin/users/`
- [X] T011 [US1] Create `CreateUserDrawerComponent` (400px drawer: name, email, initial password, role select; inline validation for required fields and duplicate email) in `crm-ui/src/app/modules/admin/create-user-drawer/`
- [X] T012 [US1] Register `/users` route in `crm-ui/src/app/modules/admin/admin.routes.ts`

**Checkpoint**: Admin can create a new user via drawer; user appears in Users table and can log in with assigned credentials and role.

---

## Phase 4: User Story 2 — Manage User Roles and Status (Priority: P1)

**Goal**: Admin can change a user's role (USER↔ADMIN) or deactivate their account. Self-deactivation and last-admin demotion/deactivation are prevented.

**Independent Test**: Change USER to ADMIN → log in as that user → verify Admin nav items visible. Deactivate user → attempt login → verify generic AUTH_FAILED. Try to deactivate own account → verify warning/error shown.

### Implementation for User Story 4

- [X] T013 [US2] Implement `UserAdminService.updateRole()`: guard that prevents demoting the last ADMIN (`COUNT(*) WHERE role=ADMIN > 1`), prevent self-demotion; `@CacheEvict("users")` + `@CacheEvict("users::list")` in `crm-service/src/main/java/com/aicrm/module/admin/`
- [X] T014 [US2] Implement `UserAdminService.updateStatus()`: guard that prevents self-deactivation (compare request `userId` with `UserPrincipal.getId()`), prevent deactivating last ADMIN; `@CacheEvict` on user + list caches
- [X] T015 [US2] Add `PUT /api/admin/users/{id}/role` and `PUT /api/admin/users/{id}/status` to `UserAdminController.java` (returns updated `UserDto`)
- [X] T016 [US2] Add inline role dropdown and status toggle to user rows in `UsersComponent` (T010); wire to `AdminUsersService`; disable controls on own row to prevent self-modification; show toast on success/error

**Checkpoint**: Role changes take effect on next page refresh. Deactivated users cannot log in. Self-deactivation and last-admin demotion are prevented with clear error messages.

---

## Phase 5: User Story 3 — Create and Delete Tags (Priority: P2)

**Goal**: Admin can create tags (name + colour) via a drawer; tags immediately available for contact assignment. Admin can delete tags (with confirmation); tag removed from all contacts.

**Independent Test**: Create tag "VIP" with green → verify in Tags table → open a contact → verify "VIP" available in tag picker. Delete "VIP" → confirm → open contact that had it assigned → verify tag gone.

### Implementation for User Story 3

- [X] T017 [US3] Create `CreateTagRequest.java` DTO in `crm-service/src/main/java/com/aicrm/module/tag/dto/`
- [X] T018 [US3] Complete `TagService.java` (full CRUD: `create`, `delete` with `@CacheEvict("tags::list")`, `getAll` already stubbed in `002-contacts`) in `crm-service/src/main/java/com/aicrm/module/tag/`
- [X] T019 [US3] Create `TagController.java` (`GET /api/admin/tags`, `POST /api/admin/tags`, `DELETE /api/admin/tags/{id}` — all `@PreAuthorize("hasRole('ADMIN')")`) in `crm-service/src/main/java/com/aicrm/module/tag/`
- [X] T020 [US3] Create Angular `AdminTagsService` (getTags, createTag, deleteTag) in `crm-ui/src/app/modules/admin/admin-tags.service.ts`
- [X] T021 [US3] Create `TagsComponent` (Tags table: colour swatch, name, contact count; "Create Tag" button; Delete button per row) in `crm-ui/src/app/modules/admin/tags/`
- [X] T022 [US3] Create `CreateTagDrawerComponent` (400px drawer: tag name field, colour picker with preset palette; inline validation for required name) in `crm-ui/src/app/modules/admin/create-tag-drawer/`
- [X] T023 [US3] Add `ModalComponent` confirmation to tag delete in `TagsComponent` (T021); on confirm call `AdminTagsService.deleteTag()`, refresh list; `@CacheEvict("tags::list")` clears contact tag picker cache
- [X] T024 [US3] Register `/tags` route in `crm-ui/src/app/modules/admin/admin.routes.ts`

**Checkpoint**: Admin can create tags; immediately available in Contact form tag picker. Tag deletion removes tag from all contacts (DB ON DELETE CASCADE on contact_tags).

---

## Phase 6: User Story 4 — Non-Admin Access Control (Priority: P1)

**Goal**: USER-role users cannot access `/users`, `/tags`, or any `POST/PUT/DELETE /api/admin/**` endpoint.

**Independent Test**: Log in as USER → navigate to `/users` → verify redirect to `/dashboard`. Navigate to `/tags` → verify redirect. Call `POST /api/admin/users` directly → verify 403 response.

### Implementation for User Story 4

- [X] T025 [US4] Verify `adminGuard` (`001-auth` T025) is applied to `admin.routes.ts` (T001) and redirects non-admin to `/dashboard`
- [X] T026 [US4] Verify `@PreAuthorize("hasRole('ADMIN')")` on `UserAdminController` and `TagController` returns 403 for USER-role JWT tokens (covered by existing `GlobalExceptionHandler` FORBIDDEN error code)
- [X] T027 [US4] Verify `SidebarComponent` (T002) hides "Users" and "Tags" nav items for USER-role users (signal-based: `isAdmin()` computed from `currentUser`)

**Checkpoint**: USER-role users are blocked from all Admin routes at both frontend (guard redirect) and backend (`@PreAuthorize` 403) levels.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [X] T028 [P] Write `UserAdminServiceTest.java` (Mockito: createUser, updateRole with last-admin guard, updateStatus with self-deactivation guard) in `crm-service/src/test/java/com/aicrm/admin/`
- [X] T029 [P] Write `UserAdminControllerTest.java` (@SpringBootTest slice — all admin endpoints; verify 403 for USER role) in `crm-service/src/test/java/com/aicrm/admin/`
- [X] T030 [P] Write `TagServiceTest.java` (Mockito: create, getAll, delete) in `crm-service/src/test/java/com/aicrm/tag/`
- [X] T031 Run quickstart.md validation scenarios end-to-end (user lifecycle: create → role change → deactivate; tag lifecycle: create → assign to contact → delete)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Depends on `001-auth` complete (adminGuard, SidebarComponent exist)
- **Phase 2 (Foundational)**: Depends on Phase 1
- **Phase 3 (US1 Invite)**: Depends on Phase 2
- **Phase 4 (US2 Role/Status)**: Depends on Phase 3 (Users table must exist)
- **Phase 5 (US3 Tags)**: Depends on Phase 1; independent of Phases 3–4
- **Phase 6 (US4 Access Control)**: Verification only; depends on Phases 2–5
- **Phase 7 (Polish)**: Depends on all above

### Parallel Opportunities

- T001 + T002: Routes setup + sidebar update
- T003 + T004 + T005 + T006: All foundational (different files)
- T007 + T010 + T011: Create service + users component + drawer
- T013 + T014: Role update + status update service methods
- T017 + T018 + T020 + T021 + T022: Tag DTOs + service + Angular service + components
- T025 + T026 + T027: All access control verification tasks
- T028 + T029 + T030: All test classes simultaneously

---

## Parallel Example: User Story 1

```bash
# Parallel group:
Task T007: UserAdminService.createUser (depends on T004 base service)
Task T010: UsersComponent table skeleton
Task T011: CreateUserDrawerComponent (can stub API calls)

# Sequential:
Task T008: POST /api/admin/users (depends on T007)
Task T009: GET /api/admin/users (depends on T004)
# Wire drawer into component after both T008 + T011 complete
```

---

## Implementation Strategy

### MVP First (US1 Invite + US4 Access Control)

1. Complete Phase 1: Setup (routes, sidebar update)
2. Complete Phase 2: Foundational (backend admin service + controller)
3. Complete Phase 3: US1 Invite User
4. Complete Phase 6: US4 Access Control verification
5. **STOP and VALIDATE**: Admin can invite users; USER role blocked from admin pages
6. Continue Phase 4 (US2) and Phase 5 (US3 Tags)

---

## Notes

- `[P]` tasks have no file conflicts — safe to run concurrently
- Last-admin guard: `UserAdminService` checks `userRepository.countByRole(Role.ADMIN) > 1` before demoting or deactivating any ADMIN — prevents system lock-out
- Self-deactivation guard: compare request target `userId` with `UserPrincipal.getId()` from `SecurityContextHolder`; throw `ApiException(ErrorCode.FORBIDDEN)` if equal
- Tag delete cascade is handled at the DB level (`ON DELETE CASCADE` on `contact_tags.tag_id`) — no application-level cascade logic needed
- `TagService.getAll()` was stubbed in `002-contacts` (T038 in that module); replace the stub implementation here with the real `@Cacheable` + `tagRepository.findAll()` logic
- Initial user passwords are set by Admin at creation time — no email invitation flow in this release
