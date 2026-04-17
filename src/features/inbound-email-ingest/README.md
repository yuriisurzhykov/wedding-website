# Feature: inbound-email-ingest

Verifies **Svix** signatures on Resend `email.received` webhooks, enforces the **contact-email allow-list** from
`resend_webhook_subscription.filter_email`, loads full content via **Resend receiving APIs**, persists **`inbound_emails`**
and **`inbound_email_attachments`** (R2), then sends a **fire-and-forget** admin notification with a deep link.

## Purpose

- Single server entry point: **`ingestInboundEmail`** for `POST /api/webhooks/resend/inbound` (HTTP mapping lives in `app/api`, not here).
- **Non-goals:** Admin UI, reply sending, webhook subscription management (`@features/resend-webhook-subscription`).

## Approach

- **Svix:** `readSvixHeaders` + `verifySvixSignature` using the signing secret from **`resend_webhook_subscription.signing_secret`**, with **`RESEND_WEBHOOK_SIGNING_SECRET`** as fallback when the row is empty (first deploy).
- **Allow-list:** Ingest is skipped (no DB row) when `filter_email` is missing or when no `To` address normalizes to that mailbox (case-insensitive).
- **Idempotency:** `resend_event_id` = Resend `data.email_id`; duplicates return `{ ok: true, kind: 'duplicate' }` without calling Resend again.
- **Body content:** `GET https://api.resend.com/emails/receiving/{id}` for HTML/text/headers; **`GET …/attachments`** for signed download URLs, then **`PutObject`** to R2 under `inbound-mail/<uuid>/…`.
- **Attachments:** Allowed MIME types and max size are enforced in `lib/persist-attachments-to-r2.ts`; unsupported types are skipped (logged).
- **Admin mail:** `notifyAdminOfInboundEmail` uses `ADMIN_EMAIL` + `RESEND_API_KEY`; failures are logged and do not fail ingest.

## Public API

- **`ingestInboundEmail({ rawBody, headers, request? })`** → `IngestInboundEmailResult`. Awaited path persists DB + R2 before returning.
- **`readSvixHeaders`**, **`verifySvixSignature`** — exposed for the route or tests; most callers only need `ingestInboundEmail`.

**Not exported:** Resend fetch helpers, R2 persistence, and notify helper (implementation details).

## Usage

```ts
import {ingestInboundEmail} from "@features/inbound-email-ingest";

export async function POST(request: Request) {
    const rawBody = await request.text();
    const result = await ingestInboundEmail({rawBody, headers: request.headers, request});
    // Map `result` to HTTP (see slice JSDoc and route README).
}
```

## Operational prerequisites

- **DNS:** Inbound domain must use Resend’s **MX** records so `email.received` fires.
- **Resend:** Domain verified with inbound; webhook created (via `@features/resend-webhook-subscription`) so **`filter_email`** and **`signing_secret`** are populated.
- **Env:** `RESEND_API_KEY`, `SUPABASE_*` service role, `R2_*` for attachments, `ADMIN_EMAIL` + `RESEND_FROM_EMAIL` for notifications, `NEXT_PUBLIC_SITE_URL` or Vercel URL for admin links.

## Errors & edge cases

- **`signature` / missing secret:** Treat as **401** at the HTTP layer (unsigned or invalid webhook).
- **`validation` / `invalid_json`:** **400** for malformed payloads.
- **`config` / `database` / `resend_api`:** **5xx** when misconfigured or upstream fails; product route may still choose **200** to avoid Resend retries if you log and accept drops (document in the route).
- **`skipped`:** **204/200** no row written — unknown sender or filter not configured.

## Extending

- New attachment types: extend the allow-list in `persist-attachments-to-r2.ts` (keep a conservative default).
- New DB fields: migrate → extend `insertRow` in `ingest-inbound-email.ts` + entity types.
