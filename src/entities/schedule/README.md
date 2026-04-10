# Entity: schedule

Day-of timeline for the wedding site: items are derived from the shared wedding calendar (single source for dates and
program copy in code).

## Public API

- `SCHEDULE` — array of `ScheduleItem` for the schedule section UI.
- `ScheduleItem` — type from `@shared/lib/wedding-calendar` (re-exported for callers).

## When to use

- **Widgets / sections:** render the schedule list from `SCHEDULE`.
- **Program edits:** change `src/shared/lib/wedding-calendar` (e.g. `day-program.ts`), not this slice.

## Extending

Add or edit entries in the wedding calendar config; `SCHEDULE` stays a thin derived list. For a new anchor on the home
page, also update `@entities/site-nav` if needed.
