# Entity: guest-account

Party members tied to an RSVP row: database shapes, normalization, and row mapping for `guest_accounts`. No HTTP,
Supabase clients, or session logic.

## Purpose

- Represent one row in `guest_accounts` and the insert shape used by `@features/rsvp-submit` (and related flows).
- Centralize display-name and companion-email normalization and party-level invariants (single primary) so features
  reuse the same rules as Zod and migrations.

**Non-goals:** magic-link creation, session cookies, cross-table email uniqueness checks (those stay in features).

## Approach

- Types mirror `supabase/schema.sql` (`GuestAccountRow` uses snake_case column names).
- **Contact source:** phone stays on `rsvp` only. Email is stored on `rsvp` and mirrored on the primary
  `guest_accounts` row (`primaryRsvpEmail` → `guest_accounts.email`) when the guest provided one. Companion rows use
  `companionEmail` when they attach their own address.
- **Duplicate names in one party:** use `guestDisplayNamesCollideInParty` / `normalizeGuestDisplayNameForPartyUniqueness`
  in feature-layer `refine` (trim + case-insensitive comparison via `toLocaleLowerCase`).

## Public API

From `index.ts`:

- Types: `GuestAccountRow`, `GuestAccountRowInsert`, `GuestPartyMemberInput`, `PartyPrimaryInvariantIssue`
- Invariants: `normalizeGuestDisplayNameForStorage`, `normalizeGuestDisplayNameForPartyUniqueness`,
  `guestDisplayNamesCollideInParty`, `isGuestDisplayNameWithinStoredLimit`, `normalizeGuestAccountEmailForStorage`,
  `checkPartyHasSinglePrimary`
- Mapper: `mapGuestPartyMemberToRowInsert(rsvpId, member)` → `GuestAccountRowInsert`

**Not exported:** numeric caps and other implementation-only constants; only predicate helpers expose limits.

## Usage

```ts
import {
    checkPartyHasSinglePrimary,
    mapGuestPartyMemberToRowInsert,
    type GuestPartyMemberInput,
} from '@entities/guest-account'

const members: GuestPartyMemberInput[] = [
    {
        displayName: 'Alex',
        isPrimary: true,
        sortOrder: 0,
        primaryRsvpEmail: 'alex@example.com',
    },
    {displayName: 'Jordan', isPrimary: false, sortOrder: 1, companionEmail: null},
]

const primaryIssue = checkPartyHasSinglePrimary(members)
if (primaryIssue) {
    // handle invariant violation before persistence
}

const rows = members.map((m) => mapGuestPartyMemberToRowInsert(rsvpId, m))
```

## Extending

1. Add a column in `supabase/schema.sql` and migrate.
2. Extend `GuestAccountRow` / `GuestAccountRowInsert` / `GuestPartyMemberInput` as needed.
3. Update `mapGuestPartyMemberToRowInsert` and this README.
4. Keep Zod in the feature slice aligned with any new string limits (entity exposes checks, not raw constants).

## Errors and edge cases

- `checkPartyHasSinglePrimary` returns `'no_primary'` or `'multiple_primary'` instead of throwing; callers decide how to
  surface errors.
- `normalizeGuestAccountEmailForStorage` returns `null` for blank input; companion rows may legitimately have `null`
  email until a rehome or bind flow sets one.
