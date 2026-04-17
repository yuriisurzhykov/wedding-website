# Feature: admin-inbox

Server-side reads and writes for inbound mail in the admin panel (`inbound_emails` and `inbound_email_attachments`).
Callers are `app/api/admin/mail/*` routes and server components that run behind the same admin session checks.

## Purpose

- List messages for the mailbox UI without loading large `html` / `text` bodies.
- Load a single message with attachment rows for the detail view.
- Delete a message and best-effort remove R2 objects referenced by attachment rows.
- Update workflow status (`unread` | `read` | `archived`).

**Non-goals:** admin authentication, rate limiting, and HTTP status mapping (owned by `@features/admin-api` and route handlers). No outbound replies (see `@features/admin-inbox-reply`).

## Approach

- **Server-only:** Supabase via `createServerClient()` (service role), consistent with other admin features.
- **List pagination:** Opaque `nextCursor` / `cursor` pair encodes a numeric offset (newest `received_at` first, then `id` descending). Invalid cursor yields `{ ok: false, kind: 'invalid_cursor' }`.
- **Delete:** Attachment `r2_key` values are read first; the parent row is deleted (FK cascade drops attachment rows); R2 deletes are best-effort with console error logging on failure.

## Public API

From `index.ts`:

| Export | Role |
|--------|------|
| `listInboundEmailsForAdmin` | Paginated list DTOs without bodies; `nextCursor` or `null`. |
| `getInboundEmailForAdmin` | Full `InboundEmailRow` plus `InboundEmailAttachmentRow[]`. |
| `deleteInboundEmailForAdmin` | Deletes by id; `not_found` if missing. |
| `updateInboundEmailStatusForAdmin` | PATCH body `{ status }` validated with Zod. |
| `inboundEmailStatusPatchBodySchema` / `inboundEmailStatusUpdateSchema` | Reuse in thin routes for shared validation. |
| `encodeInboundEmailListCursor` / `decodeInboundEmailListCursor` | Optional; list already decodes cursors. |
| `AdminInboundEmailListItem` | List row type. |

**Not exported:** internal defaults for limits beyond what `index.ts` documents.

## Usage

```ts
import {
    getInboundEmailForAdmin,
    listInboundEmailsForAdmin,
} from '@features/admin-inbox';

const list = await listInboundEmailsForAdmin({limit: 25, cursor: null});
const one = await getInboundEmailForAdmin(id);
```

## Extending

- Add filters (e.g. by `status`) by extending `ListInboundEmailsForAdminOptions` and the Supabase query; keep route query parsing in `app/api`.
- For keyset pagination at scale, replace offset cursors with a stable `(received_at, id)` keyset while preserving the same public cursor string contract if possible.

## Errors and edge cases

| Result | Meaning |
|--------|---------|
| `ok: false`, `kind: 'config'` | Supabase env / client setup failed. |
| `ok: false`, `kind: 'database'` | PostgREST / Postgres error message surfaced for logs. |
| `ok: false`, `kind: 'not_found'` | No row for that id (get / update / delete). |
| `ok: false`, `kind: 'invalid_cursor'` | Bad list cursor (client should restart from the first page). |
| `ok: false`, `kind: 'validation'` | PATCH body failed Zod (update status). |
