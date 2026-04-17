# Feature: resend-webhook-subscription

Keeps the Resend **`email.received`** webhook aligned with the public inbound URL and stores metadata (including the Svix signing secret and allow-list email) in the singleton `resend_webhook_subscription` row.

## Purpose

- **`syncResendInboundWebhook`** — idempotent: create or update the webhook via Resend’s HTTP API, then upsert `webhook_id`, `signing_secret`, `endpoint_url`, `filter_email`, and sync timestamps in Postgres.
- **`getWebhookSubscriptionStatus`** — read-only snapshot for admin UI (signing secret is never returned; only whether one is stored).

Callers: admin API routes, site-settings update hook, and mail admin auto-heal (see inbound mail plan).

## Approach

- Server-only modules (`import "server-only"`).
- Resend calls use a small fetch-based client in `lib/resend-webhooks-client.ts` (`GET/POST/PATCH` under `https://api.resend.com/webhooks`). The official SDK is not required for these five operations.
- Supabase uses `createServerClient` from `@shared/api/supabase/server` (service role) so the singleton row can be written despite RLS.
- **`filter_email`** is application metadata for inbound ingest allow-list checks; Resend does not filter by recipient — we still persist the value next to the webhook record.
- **Domain guard:** `RESEND_INBOUND_DOMAIN` must match the hostname of `endpointUrl` so a misconfigured deploy does not register the wrong URL.

## Public API

- `syncResendInboundWebhook(input)` — `{ok: true}` or `{ok: false, error}`. On Resend or DB failure, attempts to set `last_sync_error` on the singleton row (best effort).
- `getWebhookSubscriptionStatus()` — `{ok: true, status}` or `{ok: false, error}`.
- `getResendWebhookPublicUrl()` — trimmed `RESEND_WEBHOOK_PUBLIC_URL`, or `undefined` if unset (pass into `syncResendInboundWebhook` with `endpointUrl`).
- `getResendInboundDomain()` — trimmed lowercased `RESEND_INBOUND_DOMAIN`, or `undefined`.
- `RESEND_INBOUND_WEBHOOK_EVENTS` — `['email.received']` (shared constant for ingest and tests).

**Not exported:** `createResendWebhooksClient` (internal to this slice).

## Usage

```ts
import {
    getResendWebhookPublicUrl,
    syncResendInboundWebhook,
    getWebhookSubscriptionStatus,
} from "@features/resend-webhook-subscription";

const url = getResendWebhookPublicUrl();
if (url) {
    const r = await syncResendInboundWebhook({
        filterEmail: "hello@example.com",
        endpointUrl: url,
    });
}
```

## Configuration

- **`RESEND_API_KEY`** — required for sync (via `@shared/api/resend` `getResendApiKey()`).
- **`RESEND_INBOUND_DOMAIN`** — required; must equal the hostname of `endpointUrl` (e.g. `yuriimariia.wedding`).
- **`RESEND_WEBHOOK_PUBLIC_URL`** — typical value for `endpointUrl` when wiring site settings (full HTTPS URL of `/api/webhooks/resend/inbound`).

## Errors and edge cases

- Missing env, invalid URL, or Resend HTTP errors return `{ok: false, error}`; sync does not throw.
- If the stored `webhook_id` is stale (404 from Resend), sync lists webhooks by matching `endpoint`, repairs events/status, or creates a new webhook.
- Successful sync clears `last_sync_error` and sets `last_synced_at`.
