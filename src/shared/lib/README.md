# `shared/lib`

Domain-agnostic helpers used across the app (FSD **shared** layer).

## Public API (`index.ts`)

| Export                                                                             | Module     | Role                                        |
|------------------------------------------------------------------------------------|------------|---------------------------------------------|
| `cn`                                                                               | `cn.ts`    | Tailwind + `clsx` merge                     |
| `formatPhoneAsYouType`, `isUsPhoneValid`, `normalizeUsPhoneToE164`, `toDialString` | `phone.ts` | US (NANP) phone parsing/formatting for RSVP |

## Wedding calendar

Ceremony instants, schedule model, and locale formatters live in **`wedding-calendar/`** (see its README). Import the
public surface from `@shared/lib/wedding-calendar`, not from `config/` or `internal/` inside that folder.

## Imports

Prefer `@shared/lib` or `@shared/lib/wedding-calendar` over legacy `@/lib/utils`, `@/lib/phone`,
`@/lib/wedding-calendar` (those paths re-export here during migration).
