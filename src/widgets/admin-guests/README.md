# Widget: admin-guests

Admin **Guests** screen: RSVP table with filters (all / attending / not attending) backed by `@features/admin-rsvp-list`.

## Purpose

- Render the `/[locale]/admin/guests` content inside `AdminShell`.
- Surface the same data as `GET /api/admin/rsvps` by calling `listRsvpsForAdmin` on the server (no extra HTTP hop).

## Approach

- Server Component only (`AdminGuestsSection`).
- Filter state comes from the URL (`?attending=true|false`); invalid values are rejected on the page before rendering the widget.

## Public API

- `AdminGuestsSection` — props: `filter` (`all` | `attending` | `notAttending`).

**Not exported:** internal filter mapping.

## Usage

```tsx
// app/[locale]/admin/(dashboard)/guests/page.tsx
import {AdminGuestsSection} from '@widgets/admin-guests'
import {parseAdminRsvpsQuery} from '@features/admin-rsvp-list'

const parsed = parseAdminRsvpsQuery(await searchParams)
// map to filter + invalid UI
return <AdminGuestsSection filter={...} />
```

## Extending

- New column: add DB field → `RsvpRow` → table cell + `admin.guests.columns.*` in both locales.

## Configuration

- None beyond translations.

## Errors and edge cases

- If `listRsvpsForAdmin` fails, shows `admin.guests.loadError`.
- Empty list shows `admin.guests.empty`.
