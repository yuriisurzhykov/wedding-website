# admin-rsvp-list / `model`

DTO types shared by `api/` mappers and exported for admin UI / JSON responses.

| Module | Role |
|--------|------|
| `admin-guest-list-row.ts` | `AdminGuestListRow` — one admin table row per `guest_accounts` row with party fields from `rsvp`. |

**Extending:** add fields on `AdminGuestListRow` together with `map-guest-account-join-to-admin-row.ts`, the Supabase
`select` in `list-guest-accounts-for-admin.ts`, and consuming widgets plus `messages/en.json` / `messages/ru.json`.
