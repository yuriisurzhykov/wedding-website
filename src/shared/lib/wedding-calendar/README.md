# `shared/lib/wedding-calendar`

Single place for **ceremony/RSVP instants**, **day-of schedule model**, and **locale-aware date strings**. No HTTP or
secrets.

## Why it lives in `shared`

These are site-wide dates and formatting rules, not a single feature’s domain. For resolved timeline rows (titles,
instants, icons), load from `@features/wedding-schedule` and map with `resolveScheduleItems` from this package.

## Public API

See `index.ts`: `getWeddingCeremonyDate`, `getCelebrationStartDate`, `isCelebrationLive`, `getRsvpDeadlineDate` (instants for UI/countdown; gallery and wishes are gated by `site_feature_states`, not by celebration time),
`format*` helpers, `resolveScheduleItems`, `ScheduleItem`, `ScheduleTimelineRow`.

## Server vs client

Pure functions and constants — safe in Server Components, Route Handlers, and client components.

## Extending

- Change absolute times → `config/instants.ts`
- Change how dates read in UI → `config/event-display.ts`
- Change guest-facing program rows → admin schedule / Postgres `schedule_items` (`@features/wedding-schedule`)

Do not import `internal/` or `config/` from outside this slice; use the barrel export only.
