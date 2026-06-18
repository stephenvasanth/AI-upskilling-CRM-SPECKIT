# API Contracts: Contact Management

**Feature**: `002-contacts` | **Date**: 2026-06-16
**Base URLs**: `/api/contacts`, `/api/companies`
**Auth**: All endpoints require `Authorization: Bearer <token>`

> Error envelope is global — see `001-auth/contracts/auth.md`.

---

## Contacts

### GET /api/contacts

Paginated, searchable, tag-filterable contact list.

**Query params**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | int | 0 | Zero-based page index |
| `size` | int | 20 | Page size (max 100) |
| `search` | string | — | ILIKE filter on first/last name, email, company name |
| `tagId` | string | — | Filter to contacts with this tag assigned |

**Response 200**
```json
{
  "content": [
    {
      "id": "uuid",
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane@example.com",
      "company": "Acme Corp",
      "tags": [{ "id": "uuid", "name": "VIP", "colour": "#3B82F6" }],
      "createdAt": "2026-06-16T10:00:00Z"
    }
  ],
  "totalElements": 42,
  "totalPages": 3,
  "page": 0,
  "size": 20
}
```

> Cached at `contacts::list::{page}`. Invalidated on any contact write.

---

### POST /api/contacts

Create a new contact.

**Request**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@example.com",
  "phone": "+1 555 0100",
  "jobTitle": "Head of Sales",
  "companyId": "uuid",
  "ownerId": "uuid",
  "tagIds": ["uuid1", "uuid2"]
}
```

| Field | Required | Rules |
|-------|----------|-------|
| `firstName` | ✅ | 1–100 chars |
| `lastName` | ✅ | 1–100 chars |
| `email` | — | Valid email format if provided |
| `phone` | — | Free text, max 50 chars |
| `jobTitle` | — | Max 100 chars |
| `companyId` | — | Must exist in `companies` table |
| `ownerId` | — | Must exist in `users` table |
| `tagIds` | — | Array of valid tag UUIDs |

**Response 201** — full `ContactDto`

> On success, evicts `contacts::list::*` cache keys.

---

### GET /api/contacts/{id}

Get single contact detail.

**Response 200** — `ContactDto`
```json
{
  "id": "uuid",
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane@example.com",
  "phone": "+1 555 0100",
  "jobTitle": "Head of Sales",
  "companyId": "uuid",
  "companyName": "Acme Corp",
  "ownerId": "uuid",
  "ownerName": "CRM Admin",
  "tags": [{ "id": "uuid", "name": "VIP", "colour": "#3B82F6" }],
  "createdAt": "2026-06-16T10:00:00Z",
  "updatedAt": "2026-06-16T10:00:00Z"
}
```

> Cached at `contacts::{id}`. Invalidated on update/delete.

**Response 404**
```json
{ "error": { "code": "NOT_FOUND", "message": "Contact not found" } }
```

---

### PUT /api/contacts/{id}

Update all fields of an existing contact.

**Request** — same shape as `POST /api/contacts`

**Response 200** — updated `ContactDto`

> On success, evicts `contacts::{id}` and `contacts::list::*` cache keys.

---

### DELETE /api/contacts/{id}

Hard-delete a contact. Cascades to linked Activities. Preserves Tasks (contact_id set to NULL).

**Response 204** — no body

> On success, evicts `contacts::{id}` and `contacts::list::*`.

---

## Companies (read-only lookup)

### GET /api/companies

Returns all companies as a flat list for the dropdown picker.

**Response 200**
```json
[
  { "id": "uuid", "name": "Acme Corp" },
  { "id": "uuid", "name": "Globex" }
]
```

> Cached at `companies::list` TTL 24 h.

---

## Angular Service Contract

```typescript
// crm-ui/src/app/modules/contacts/contacts.service.ts
@Injectable({ providedIn: 'root' })
export class ContactsService {
  getContacts(params: ContactFilterParams): Observable<PageResult<ContactSummary>> { ... }
  getContact(id: string): Observable<ContactDto> { ... }
  createContact(body: CreateContactRequest): Observable<ContactDto> { ... }
  updateContact(id: string, body: UpdateContactRequest): Observable<ContactDto> { ... }
  deleteContact(id: string): Observable<void> { ... }
  getCompanies(): Observable<CompanyDto[]> { ... }
}
```
