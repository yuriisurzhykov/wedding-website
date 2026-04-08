# Entity: wedding-venue

Static venue and contact facts for the site (address, map link, parking note, contact email/phone). No HTTP.

## Public API

- `VENUE`, `CONTACT` — read-only config objects.
- `VenueInfo`, `ContactInfo` — types.

## When to use

- **Widgets** (hero map link), **RSVP emails** (location line), any UI that shows where the wedding is.

## Extending

Edit `model/venue.ts`. Keep `src/shared/lib/wedding-calendar/config/day-program.ts` map URL in sync with `VENUE.mapsUrl` (documented there) or consolidate later.
