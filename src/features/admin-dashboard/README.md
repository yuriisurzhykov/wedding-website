# Feature: admin-dashboard

Briefly: server-only aggregation for the admin home dashboard — parallel Supabase reads (service role) for RSVP, guest
accounts, sessions, wishes, gallery, inbound mail, and dietary notes. Callers are admin widgets or pages that render KPI
cards.

## Purpose

- Expose a single `fetchDashboardStats()` call so the dashboard loads every counter in one round-trip burst (parallel
  queries), without R2 `ListObjects` (gallery storage uses `photos.size_bytes`).

**Non-goals:** admin authentication, HTTP mapping, or UI layout. Anomaly heuristics for the alerts panel live in
  `fetch-dashboard-stats.ts` under `stats.alerts` (parallel counts with the main batch).

## Approach

- **`import "server-only"`** and `createServerClient()` from `@shared/api/supabase/server`, same as `@features/wish-list`
  count helpers.
- **Parallelism:** one `Promise.all` over independent PostgREST selects / head counts; failures short-circuit with the
  first database error message. Failed outbound sends in rolling windows are counted in `stats.alerts` for the dashboard
  problems panel.
- **“Online now”:** `guest_sessions` rows with `expires_at` in the future and `last_seen_at` within the last 15 minutes
  (aligned with session validation touch frequency).
- **Aggregates:** `guest_count.sum()` and `size_bytes.sum()` responses are normalized with a small `pickAggregateSum`
  helper because PostgREST / client typings vary by shape.

## Public API

From `index.ts` (only supported import path for consumers outside this slice):

| Export | Role |
|--------|------|
| `fetchDashboardStats` | Returns `{ ok: true, stats }` or `{ ok: false, kind, message }`. |
| `DashboardStats` | Typed KPI + allergy rows for the dashboard. |
| `FetchDashboardStatsResult` | Discriminated union for the fetch call. |

**Not exported:** `pickAggregateSum`, `firstDbMessage`, or the 15-minute window constant (internal).

## Usage

```ts
import {fetchDashboardStats} from "@features/admin-dashboard";

const result = await fetchDashboardStats();
if (!result.ok) {
    // map result.kind / result.message (after admin auth)
    return;
}
// result.stats.rsvp.total, result.stats.mail.unread, …
```

## Extending

- **New KPI:** add a parallel branch inside `fetch-dashboard-stats.ts`, extend `DashboardStats`, update widget + i18n.
- **More alert heuristics:** add another parallel count in the same `Promise.all`, extend `stats.alerts`, and surface in
  `DashboardAlertsPanel` with new `admin.dashboard.alerts.*` keys.

## Configuration

- Online window is fixed at 15 minutes inside `fetch-dashboard-stats.ts` (must match product copy for “online now”).

## Errors & edge cases

- **`kind: "config"`** — missing `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` (same as other server features).
- **`kind: "database"`** — any Supabase error from the parallel batch; message is the first failing query’s message.
- **Empty tables:** counts default to `0`; sums default to `0` when there are no rows.
