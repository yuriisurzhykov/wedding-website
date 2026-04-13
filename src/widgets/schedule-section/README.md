# Widget: schedule-section

Guest-facing **schedule** section: section chrome + `ScheduleTimeline`. Timeline rows are built from **Postgres**
(`schedule_items` / `schedule_section`) via `@features/wedding-schedule`, not from `site_settings` or static
`messages`-keyed config.

## Purpose

- Render the wedding day timeline with localized clock labels via `@shared/lib/wedding-calendar`.
- Accept **pre-resolved** `ScheduleItem[]` and optional header overrides from the parent RSC (typically
  `getResolvedGuestSchedule` on `app/[locale]/page.tsx`).

## Approach

- **`ScheduleSection`** is an async server component: resolves `next-intl` fallbacks for section title/subtitle/emphasis
  badge when optional DB overrides are null or blank.
- **`ScheduleTimeline`** is presentation-only: expects resolved strings and icon data (preset component, inline SVG, or
  image URL) from the mapped items.

## Public API

| Export | Role |
|--------|------|
| `ScheduleSection` | Async RSC. Props: `items` (from `getResolvedGuestSchedule(locale).items`), optional `headerTitle` / `headerSubtitle` / `emphasisBadgeText` (from `sectionHeaders`), `theme`. |
| `ScheduleTimeline` | Timeline UI; used inside `ScheduleSection` or elsewhere with the same item shape. |

## Usage

Home page loads site settings and schedule **in parallel**, then passes resolved props (see `@features/wedding-schedule`
README):

```tsx
import {getResolvedGuestSchedule} from '@features/wedding-schedule'
import {ScheduleSection} from '@widgets/schedule-section'

const resolvedSchedule = await getResolvedGuestSchedule(locale)

<ScheduleSection
  items={resolvedSchedule.items}
  headerTitle={resolvedSchedule.sectionHeaders.title}
  headerSubtitle={resolvedSchedule.sectionHeaders.subtitle}
  emphasisBadgeText={resolvedSchedule.sectionHeaders.emphasisBadge}
/>
```

## Extending

- New timeline field: extend DB + entity + `mapScheduleItemsToTimelineRows` + `ScheduleTimeline` props; keep this widget
  thin (no direct Supabase calls).
