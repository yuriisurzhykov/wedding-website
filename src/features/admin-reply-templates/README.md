# Feature: admin-reply-templates

CRUD for `reply_templates` (admin-only; service role). Used by admin mail API routes and `@features/admin-inbox-reply` when applying a named template to an outbound reply.

## Purpose

Store single-locale reply skeletons (`name`, `subject`, `heading`, `body_html`, optional `body_text`) with optional **`is_default`**. Placeholders `{{senderName}}`, `{{heading}}`, `{{body}}` are documented on `ReplyTemplateRow` in `@entities/inbound-email`; rendering and sanitization live in admin reply send flow.

## Approach

- Server-only modules (`import "server-only"`); Supabase via `createServerClient()` (service role).
- Zod validates create/update payloads; HTTP adapters stay in `app/api/.../route.ts`.
- At most one row has `is_default === true`: creating or updating with `is_default: true` clears the flag on all other rows.

## Public API

- `listReplyTemplatesForAdmin()` — newest first.
- `getReplyTemplateByIdForAdmin(id)` — single row or `not_found`.
- `createReplyTemplateForAdmin(body)` — `replyTemplateCreateSchema`.
- `updateReplyTemplateForAdmin(id, body)` — partial `replyTemplateUpdateSchema`; empty patch is rejected.
- `deleteReplyTemplateForAdmin(id)` — `inbound_email_replies.template_id` nulls via FK.

**Not exported:** row mappers and default-clearing helper (`lib/*` except schemas).

## Usage

```ts
import {
    listReplyTemplatesForAdmin,
    createReplyTemplateForAdmin,
} from "@features/admin-reply-templates";

const result = await listReplyTemplatesForAdmin();
```

## Extending

- New column: migration → extend `ReplyTemplateRow` in `@entities/inbound-email` → Zod schemas → mappers.

## Errors and edge cases

- Validation: `{ ok: false, kind: "validation" }` with joined Zod messages.
- Missing env / client: `{ ok: false, kind: "config" }`.
- Supabase errors: `{ ok: false, kind: "database" }`.
- Missing id on update/delete/get: `{ ok: false, kind: "not_found" }`.

For HTTP, map these to **400** (validation), **404** (not found), **500** (config/database) in thin route handlers.
