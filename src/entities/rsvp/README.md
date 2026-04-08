# Entity: RSVP

Subject model for guest RSVPs: database row shape, form payload shape, and the mapping between them. No HTTP, email, or
Supabase clients.

## Public API

Re-exported from `index.ts`:

- Types: `RsvpRow`, `RsvpRowInsert`, `RsvpFormInput`
- Form UI types (same as dynamic form): `FormField`, `FormValues`, `FieldType`
- `RSVP_FIELDS` — `FormField[]` for the production RSVP form
- `mapRsvpFormToRow(input)` → `RsvpRowInsert`

Internal defaults for guest counts live only inside `model/map-form-to-row.ts` (not exported).

## When to use

- **Features / API routes:** after validating JSON with Zod, call `mapRsvpFormToRow` before inserting into Postgres.
- **UI:** import `RSVP_FIELDS` (and form types if needed) from `@entities/rsvp`; transitional `lib/config/rsvp` re-exports the same. Submit payload should align with `RsvpFormInput` (camelCase, `attending` required).

## Invariants encoded in the mapper

- Optional text fields become `null` when empty after trim.
- If `attending` is false, `dietary` is always `null` even if the client sent a value (avoids stale hidden fields).
- Guest count when not attending is a fixed stored value (see implementation). When attending, missing or invalid
  `guestCount` falls back to a single internal default.

## Extending (new field)

1. Add the column in `supabase/schema.sql` and migrate.
2. Extend `RsvpRow` / `RsvpRowInsert` in `model/types.ts`.
3. Add the key to `RsvpFormInput` if it comes from the form.
4. Update `model/rsvp-form-fields.ts`, `mapRsvpFormToRow`, the feature-layer Zod schema, and email templates.
