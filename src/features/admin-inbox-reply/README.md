# Feature: admin-inbox-reply

Sends admin replies to stored inbound messages: merges allow-listed `{{senderName}}`, `{{heading}}`, `{{body}}` placeholders when a `reply_templates` row is selected, renders HTML with the shared wedding transactional theme and fixed footer, sends via Resend with **`from`** = `formatResendFromLine` from `@features/admin-email-senders` using **`site_settings.public_contact_sender_id`** when set (mailbox must match `public_contact.email`), otherwise the **`email_senders`** row whose `mailbox` matches the public contact email; `In-Reply-To` / `References` for threading, then writes `inbound_email_replies` and `email_send_log`.

## Purpose

- Owns the server-side send path for `/api/admin/mail/.../reply` (implemented separately).
- Does **not** own listing inbound mail or template CRUD (`admin-inbox`, `admin-reply-templates`).

## Approach

- **Server-only:** `sendInboxReply` uses the service-role Supabase client and Resend; call only from authenticated admin API routes.
- **Placeholders:** `REPLY_TEMPLATE_PLACEHOLDER_KEYS` from `@entities/inbound-email`; unknown `{{keys}}` are stripped. User-controlled fragments are escaped (`senderName`, `heading`) or sanitized (`body` HTML allow-list via `isomorphic-dompurify`).
- **Theme:** layout and colours match `@features/rsvp-submit` `wedding-email-theme` (imported as required by the product plan).
- **Logging:** `email_send_log.segment` is `inbound-reply`; `template_id` is always `null` (those rows reference `email_templates`, not inbox reply templates).

## Public API

- `sendInboxReply(raw: unknown): Promise<SendInboxReplyResult>` — validates with Zod, loads inbound row and optional template, sends email, persists reply row on success.
- `sendInboxReplyBodySchema` / `SendInboxReplyInput` — JSON body for the admin reply route.
- `SendInboxReplyResult` — `ok` + ids or `kind` (`validation` | `not_found` | `config` | `database` | `resend`).

**Not exported:** internal render/sanitize helpers (narrow surface for callers).

## Usage

```ts
import {
    sendInboxReply,
    sendInboxReplyBodySchema,
} from "@features/admin-inbox-reply";

const result = await sendInboxReply(await request.json());
if (!result.ok) {
    // map result.kind to HTTP status
}
```

## Errors and edge cases

- **validation:** Zod failure or empty resolved subject after template merge — caller returns **400**.
- **not_found:** missing inbound row or `template_id` — **404**.
- **config:** missing `RESEND_API_KEY`, empty recipient/`public_contact` email, no matching **`email_senders`** row for that mailbox (and no valid `public_contact_sender_id`) — **500** / **503** per route policy.
- **database:** Supabase errors — **500**.
- **resend:** provider error; `email_send_log` records `failed` before returning — **502** or **500** per route.

A send may succeed in Resend but fail when inserting `inbound_email_replies`; the handler logs and returns **500** so the route can surface a partial failure.

## Extending

- New placeholder: add to `REPLY_TEMPLATE_PLACEHOLDER_KEYS`, escape/sanitize in `sendInboxReply` when building `vars`, document in entity `reply-template` README.
- Locale-specific templates: extend `reply_templates` and this feature in one change set.
