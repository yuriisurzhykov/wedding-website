# Widget: `rsvp-section`

Composes the RSVP **section** on the marketing home page: `Section` + `SectionHeader`, deadline line in the subtitle, and the existing `DynamicForm` backed by `POST /api/rsvp`.

## Why this slice exists

- Keeps **page routes** thin: import `RsvpSection` from `@widgets/rsvp-section` instead of inlining layout, i18n, and submit wiring.
- Splits **server** (locale, static copy, deadline formatting) from **client** (form state, `fetch`) so we match the same pattern as other sections (`Welcome`, `OurStory`) while respecting `DynamicForm` as a client component.

## Public API

| Export        | Role                                                                 |
|---------------|----------------------------------------------------------------------|
| `RsvpSection` | Async server component — render once per request on the page.        |

Internal pieces (`RsvpSectionForm`, `submitRsvpFetch`) are not re-exported; extend behavior inside this widget.

## Data flow

1. **Subtitle** — `formatRsvpDeadlineLine(locale)` from `@shared/lib/wedding-calendar` is passed into `t('subtitle', { deadline })` (messages: `rsvp.subtitle`).
2. **Submit** — `RsvpSectionForm` calls `submitRsvpFetch` with the object `DynamicForm` builds (`attending`, field keys). That posts JSON to `/api/rsvp` (same-origin, not under `[locale]`).
3. **Errors** — Non-OK responses throw; `DynamicForm` shows the generic `rsvp.error` string. Validation details from the API are not surfaced in the UI yet.

## Adding a field

Follow the same order as `@features/rsvp-submit` README: `@entities/rsvp` (`RSVP_FIELDS`) + messages → Zod → entity map → DB/email. This widget only depends on `RSVP_FIELDS` and the API contract staying aligned.

## Observability

Failed submits: browser network tab on `POST /api/rsvp`; server logs under `[api/rsvp]` / `[rsvp-submit]` on Vercel.
