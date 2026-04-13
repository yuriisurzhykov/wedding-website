# Entity: wedding-venue

Static venue and contact facts for the site (address, map link, parking note, contact email/phone). No HTTP. **Widgets**, RSVP email templates, and pages import this slice for location and contact data.

## Purpose

- Single source of truth for venue address/map/parking and host contact phone/email.
- **Non-goals:** HTTP, admin editing, or persistence (values are code-defined until a separate admin/settings flow exists).

## Approach

- Venue and contact values live in `model/venue.ts` as internal records. **Getters** expose data and derived URLs so `index.ts` does not export raw contact constants.
- **`tel:`** links: `getContactTelHref()` uses `toDialString` from `@shared/lib/phone` so dial normalization stays centralized.
- **`mailto:`** links: `getContactMailtoHref()` builds the URL from the configured email (trimmed; extend there if encoding rules change).

## Public API

- From `index.ts`: `VENUE`; types `VenueInfo`, `ContactInfo`; `getContactInfo()`, `getContactTelHref()`, `getContactMailtoHref()`.
- **Not exported:** the underlying contact record object (use the getters above).

## Usage

```ts
import {
    VENUE,
    getContactInfo,
    getContactTelHref,
    getContactMailtoHref,
} from '@entities/wedding-venue'

const {phone, email} = getContactInfo()
const tel = getContactTelHref()
const mailto = getContactMailtoHref()
```

## Extending

- Edit `model/venue.ts`: update `contactFacts` / `VENUE`, extend `ContactInfo` or add types, add getters for new derived values, then i18n and UI in consuming widgets.

Keep venue map links consistent with `schedule_items.location_url` in the admin schedule when both describe the same place.

## Errors and edge cases

- `getContactTelHref()` returns `undefined` when `toDialString` yields an empty string; callers should render display text without a `tel:` link.
