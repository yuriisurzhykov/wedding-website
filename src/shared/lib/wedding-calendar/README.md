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

## Locale tags and clock policy

URL and `next-intl` segments stay `en` / `ru` (`i18n/routing.ts`). All `Intl.DateTimeFormat` calls in this package use a
stable BCP-47 tag derived from that segment — not the raw segment — so dates and times match the chosen language and a
predictable regional style:

| Site segment | `Intl` tag | Notes |
| --- | --- | --- |
| `en`, `en-*` | `en-US` | US-style `dateStyle` where used; **12-hour** clock when we format hour/minute. |
| `ru`, `ru-*` | `ru-RU` | Long Russian month names where `dateStyle` applies; **24-hour** clock for hour/minute. |
| anything else | `en-US` | Same default as routing’s `defaultLocale`. |

Implementation: `internal/intl-locale.ts` — `toIntlBcp47ForSiteLocale`, `hour12ForSiteLocale`. All `format*` helpers in
`internal/locale-strings.ts` build formatters through that mapping so the hero, RSVP/story lines, and schedule clock cells
stay consistent. Do not reintroduce a separate `hour12` (for example `hour12: false`) on `DISPLAY_FORMATS.scheduleClock`
in `config/event-display.ts`; **one** policy lives next to the formatters.

`formatScheduleClock` still anchors on **UTC midnight + wall hour/minute** from the DB so SSR output does not depend on
the server’s local zone; only the displayed clock style (12h vs 24h) follows `hour12ForSiteLocale`.

## Extending

- Change absolute times → `config/instants.ts`
- Change how dates read in UI → `config/event-display.ts` (styles only; not `hour12` for schedule — see above)
- Adjust BCP-47 mapping or 12h/24h policy → `internal/intl-locale.ts` (used by `internal/locale-strings.ts`)
- Change guest-facing program rows → admin schedule / Postgres `schedule_items` (`@features/wedding-schedule`)

Do not import `internal/` or `config/` from outside this slice; use the barrel export only.
