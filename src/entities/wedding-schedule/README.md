# Entity: wedding-schedule

Normalized wedding day schedule: Postgres tables `schedule_section` (singleton row) and `schedule_items` (ordered
timeline rows). This is the **only** persisted source for guest-facing schedule copy and icons; it replaces the removed
`site_settings.schedule_program` JSON column.

## Purpose

- Zod contracts for **DB rows** (`schedule_section`, `schedule_items`) and for the admin **replace-all** payload used by
  `PATCH /api/admin/schedule`.
- Stable **validation codes** on admin payloads (for logging, future i18n, or clients that branch on machine-readable
  errors).
- **Admin presets** — local ru/en templates (icon + text), not `messages` keys.
- **Icon preset ids** aligned with `@shared/ui/icons/schedule` (`ScheduleIconPresetId`).

Non-goals: no Supabase clients, no HTTP, no caching — those live in `@features/wedding-schedule`.

## Approach

- Row schemas parse Supabase `select` results; unknown columns or bad fragments are handled in the feature layer
  (`safeParse`, drop invalid rows).
- Replace payload schemas enforce domain rules: at most one of `icon_preset` / `icon_svg_inline` / `icon_url`, at most one
  `emphasis: true`, unique optional `id`s, list length bounds.

## Public API

From `index.ts` (do not import from `model/*` outside tests):

| Area | Exports |
|------|---------|
| **DB rows** | `ScheduleSectionRow`, `ScheduleItemRow`, `scheduleSectionRowSchema`, `scheduleItemRowSchema` |
| **Admin write** | `weddingScheduleReplacePayloadSchema`, `weddingScheduleReplaceItemSchema`, `weddingScheduleSectionPatchSchema`, `scheduleReplacePayloadValidationCode`, types `WeddingScheduleReplacePayload`, `WeddingScheduleReplaceItem`, `WeddingScheduleSectionPatch` |
| **Presets** | `WEDDING_SCHEDULE_ADMIN_PRESETS`, `getWeddingSchedulePresetBySegmentId`, type `WeddingScheduleAdminPreset` |
| **Icons** | `SCHEDULE_ICON_PRESET_VALUES`, `scheduleIconPresetSchema`, `ScheduleIconPresetId`, `SCHEDULE_ICON_SVG_UPLOAD_MAX_BYTES` |

**Not exported:** internal migration-only helpers (if any appear under `model/` later).

## Usage

```ts
import {
  weddingScheduleReplacePayloadSchema,
  scheduleReplacePayloadValidationCode,
  type ScheduleItemRow,
} from '@entities/wedding-schedule'

const parsed = weddingScheduleReplacePayloadSchema.safeParse(body)
if (!parsed.success) {
  const code = scheduleReplacePayloadValidationCode(parsed.error)
  // …
}
```

## Extending

1. **New column on items or section:** migration → extend row Zod → extend `weddingScheduleReplaceItemSchema` / section
   patch → `replaceWeddingSchedule` in `@features/wedding-schedule` → admin UI → guest mapper
   (`mapScheduleItemsToTimelineRows` / `resolveScheduleSectionHeaders`).
2. **New icon preset:** add to `SCHEDULE_ICON_PRESET_VALUES`, DB check constraint, and `getScheduleIcon` in
   `@shared/ui/icons/schedule`.
3. **New locale:** migration (`ADD COLUMN` or translation table) + extend resolvers in `@features/wedding-schedule`.

## Errors and edge cases

- `scheduleReplacePayloadValidationCode(zodError)` returns the first issue whose `message` matches `[A-Z][A-Z0-9_]*`,
  else `SCHEDULE_ITEM_FIELDS_INVALID`. Payload-level refinements expose codes such as `SCHEDULE_ITEMS_EMPTY`,
  `SCHEDULE_DUPLICATE_IDS`, `SCHEDULE_MULTIPLE_EMPHASIS`, `SCHEDULE_ICON_EXCLUSIVE`.
