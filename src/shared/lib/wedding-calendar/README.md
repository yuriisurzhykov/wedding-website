# `shared/lib/wedding-calendar`

Single place for **ceremony/RSVP instants**, **day-of schedule model**, and **locale-aware date strings**. No HTTP or secrets.

## Why it lives in `shared`

These are site-wide dates and formatting rules, not a single feature’s domain. Entities that need schedule rows can import `getScheduleItems` from here without pulling in widgets or features.

## Public API

See `index.ts`: `getWeddingCeremonyDate`, `getRsvpDeadlineDate`, `format*` helpers, `getScheduleItems`, `ScheduleItem`.

## Server vs client

Pure functions and constants — safe in Server Components, Route Handlers, and client components.

## Extending

- Change absolute times → `config/instants.ts`
- Change how dates read in UI → `config/event-display.ts`
- Change program rows → `config/day-program.ts`

Do not import `internal/` or `config/` from outside this slice; use the barrel export only.
