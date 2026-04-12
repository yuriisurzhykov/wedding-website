# Feature: admin-email-templates

CRUD for `email_templates` (admin-only; service role). Used by admin API routes and by `@features/admin-email-dispatch` to load a template before sending.

## Purpose

Persist reusable HTML/text email bodies with `{{name}}`-style placeholders (whitelist enforced in dispatch). Optional **`sender_id`** links to `email_senders`; when null, sends use `RESEND_FROM_EMAIL` via `getTransactionalFromAddress()`.

## Public API

- `listEmailTemplatesForAdmin()` — newest first.
- `getEmailTemplateByIdForAdmin(id)` — single row or `not_found`.
- `getEmailTemplateBySlugForAdmin(slug)` — single row or `not_found`.
- `createEmailTemplateForAdmin(body)` — Zod `emailTemplateCreateSchema`.
- `updateEmailTemplateForAdmin(id, body)` — partial Zod `emailTemplateUpdateSchema`.
- `deleteEmailTemplateForAdmin(id)`.

## HTTP

Thin handlers: `GET/POST /api/admin/email/templates`, `PATCH/DELETE /api/admin/email/templates/[id]` (rate limit + `isAdminApiAuthorized` first).

## Errors

Validation failures return `{ok: false, kind: 'validation'}`. Supabase errors return `database` or `config` (missing service role env).

## Extension

Add columns via migration + extend Zod schemas + `EmailTemplateRow` in `@entities/email-template`.
