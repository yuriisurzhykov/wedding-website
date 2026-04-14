# Widget: admin-guests

Admin **Guests** screen: one table row per `guest_accounts` row, with party-level fields and URL filters. Data comes from `@features/admin-rsvp-list` (same contract as `GET /api/admin/rsvps`).

## Purpose

- Render `/[locale]/admin/guests` inside `AdminShell`: title, subtitle, filter links, and the guest table.
- Load `AdminGuestListRow[]` on the server via `listGuestAccountsForAdmin` so the page does not call its own HTTP API.
- Keep presentation split (shell, filter nav, table + column config) so new columns or filters do not duplicate table markup.

**Non-goals:** defining the DTO, Supabase query, or query-string validation — those live in `@features/admin-rsvp-list`. Introducing a shared `@shared/ui` admin-table primitive without a confirmed cross-screen API is out of scope (see **Customization**).

## Approach

- **Server Components only:** `AdminGuestsSection` awaits `listGuestAccountsForAdmin({ attending })` and passes rows into `AdminGuestsTable`.
- **Filter model:** the page parses `searchParams` with `parseAdminRsvpsQuery`, maps `attending` to `filter: "all" | "attending" | "notAttending"`, and passes `filter` into the widget. Invalid query → page-level error UI before the widget mounts.
- **Columns:** `ADMIN_GUEST_TABLE_COLUMNS` in `admin-guests-table-columns.tsx` — `headerKey` (next-intl) + `renderCell` — keeps the table body generic.
- **API parity:** `GET /api/admin/rsvps` returns `{ guests: AdminGuestListRow[] }` for the same parsed query; the widget uses the feature directly for one less hop.

## Public API

- **`AdminGuestsSection`** — props: `filter` (`"all"` | `"attending"` | `"notAttending"`).

**Not exported:** `AdminGuestsSectionShell`, `AdminGuestsFilterNav`, `AdminGuestsTable`, `ADMIN_GUEST_TABLE_COLUMNS`, `admin-guests-filter` helpers (internal to the slice).

## Usage

```tsx
// app/[locale]/admin/(dashboard)/guests/page.tsx
import {parseAdminRsvpsQuery} from "@features/admin-rsvp-list";
import {AdminGuestsSection} from "@widgets/admin-guests";

const parsed = parseAdminRsvpsQuery(await searchParams);
if (!parsed.ok) {
    // render invalid-query UI (see page implementation)
}

let filter: "all" | "attending" | "notAttending" = "all";
if (parsed.attending === true) filter = "attending";
else if (parsed.attending === false) filter = "notAttending";

return <AdminGuestsSection filter={filter} />;
```

## Extension

- **New column:** extend `AdminGuestListRow` and the guest-account mapper in `@features/admin-rsvp-list` → add a column entry to `ADMIN_GUEST_TABLE_COLUMNS` → add `admin.guests.columns.*` (and any value keys) in **both** `messages/en.json` and `messages/ru.json`.
- **New filter:** extend `parseAdminRsvpsQuery` / feature options → map the new dimension on the page to a prop (or widen `filter`) → update `AdminGuestsFilterNav` and `listGuestAccountsForAdmin` options.
- **New row behavior:** prefer `renderCell` in the column config; avoid forking `AdminGuestsTable` markup unless the layout truly diverges.

## Customization

- **Today:** the exported surface is intentionally narrow (`AdminGuestsSection` + `filter` only). `AdminGuestsSectionShell` is internal: fixed section chrome (card, heading, optional subtitle).
- **When a second admin screen needs the same chrome:** add optional props on the shell or section (for example `className`, or an `afterFilters` slot) **inside this widget** only when there is a concrete second consumer — avoid speculative props on `index.ts`.
- **Shared admin table primitive:** if multiple widgets need the same abstraction, agree the `@shared/ui` boundary first (see **ARCHITECTURE.md** and project FSD rules) before extracting.

## Errors and edge cases

- **`listGuestAccountsForAdmin` failure:** `admin.guests.loadError` inside the shell (no table).
- **Empty list:** `admin.guests.empty` after filters.
- **Missing cell text:** `admin.guests.valueEmpty` passed into the table as `emptyDisplay`.
