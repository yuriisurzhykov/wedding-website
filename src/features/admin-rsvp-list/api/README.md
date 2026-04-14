# admin-rsvp-list / `api`

Internal server modules for `@features/admin-rsvp-list`. **Do not import these paths from outside the feature** — use
`@features/admin-rsvp-list` only. The slice `README.md` documents the public contract and HTTP behavior.

| Module | Role |
|--------|------|
| `list-guest-accounts-for-admin.ts` | Supabase read: `guest_accounts` + embedded `rsvp`, optional `attending` filter, map + sort. |
| `map-guest-account-join-to-admin-row.ts` | Pure PostgREST row → `AdminGuestListRow` (or `null` if invalid). |
| `sort-admin-guest-rows-by-party.ts` | Pure sort: party `submittedAt` desc, then `sortOrder` asc. |
| `list-rsvps-for-admin.ts` | Legacy `rsvp.select('*')` list for admin-style reads. |
| `parse-admin-rsvps-query.ts` | Validates optional `attending` query / search params. |

**Extending:** add or change behavior here, then re-export types or functions from `../index.ts` only when they belong in
the public API.
