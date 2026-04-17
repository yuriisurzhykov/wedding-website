# Entity: inbound-email

Shared types for inbound mail storage, admin reply templates, and the Resend `email.received` webhook payload.

## Purpose

- Give `@features/inbound-email-ingest`, `@features/admin-inbox`, `@features/admin-inbox-reply`, and `@features/admin-reply-templates` a single place for DB row shapes and webhook parsing contracts without importing feature code into each other.
- Non-goals: HTTP adapters, Svix verification, R2 persistence, or Resend API clients (those live in features).

## Approach

- **Tables:** Types align with migrations `inbound_emails`, `inbound_email_attachments`, and `reply_templates` (see plan in repository docs).
- **Webhook:** `resendEmailReceivedEventSchema` validates the JSON body shape documented by Resend; HTML/text and attachment bytes are not in the webhook — callers must fetch them via the Received Email / Attachments APIs using `data.email_id`.

## Public API

- **Inbound mail:** `EmailStatus`, `InboundEmailRow`, `InboundEmailAttachmentRow`, and domain aliases `InboundEmail`, `InboundEmailAttachment`.
- **Reply templates:** `ReplyTemplateRow`, `REPLY_TEMPLATE_PLACEHOLDER_KEYS`, `REPLY_TEMPLATE_BRACE_PLACEHOLDERS`, `ReplyTemplatePlaceholderKey`.
- **Resend webhook:** `resendEmailReceivedEventSchema`, `resendEmailReceivedDataSchema`, `resendEmailReceivedAttachmentSchema`, plus inferred types `ResendEmailReceivedEvent`, `ResendEmailReceivedData`, `ResendEmailReceivedAttachment`.

**Not exported:** Internal model file paths; consumers must import from `@entities/inbound-email` only.

## Usage

```ts
import {
    resendEmailReceivedEventSchema,
    type InboundEmailRow,
} from "@entities/inbound-email";

const parsed = resendEmailReceivedEventSchema.safeParse(JSON.parse(rawBody));
if (!parsed.success) {
    // handle validation error
}
const emailId = parsed.data.data.email_id;
```

## Extending

- New DB columns → extend `InboundEmailRow` / `InboundEmailAttachmentRow` / `ReplyTemplateRow` and apply a matching migration.
- New Resend webhook fields → extend `resendEmailReceivedDataSchema` (prefer optional fields to stay compatible with API changes).
- New reply placeholders → add to `REPLY_TEMPLATE_PLACEHOLDER_KEYS` and `REPLY_TEMPLATE_BRACE_PLACEHOLDERS`, then update template renderers and admin UI in the same change.

## Errors and edge cases

- Parsing: use `safeParse` on webhook JSON; malformed payloads should map to 4xx in the route, per feature contract.
- `from` is a single string (may include display name); split for UI in the feature layer if needed.
