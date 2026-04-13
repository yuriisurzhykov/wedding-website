/**
 * Wedding calendar — **public entry only**. App code imports from here, not from `config/` or `internal/`.
 *
 * ## Layout
 *
 * | Area | Path | Change when |
 * |------|------|-------------|
 * | Ceremony, celebration start & RSVP instants | `config/instants.ts` | The real date/time of those events changes |
 * | Locale display (zone, 12h, date style) | `config/event-display.ts` | How you want dates/times to *look* |
 * | Day-of schedule copy & order | Postgres `schedule_items` | Edited in admin; loaded via `@features/wedding-schedule` |
 *
 * ## Why this split
 *
 * Each config file has **one reason to edit**, so you do not mix “move ceremony by an hour” with
 * “switch schedule to 12-hour clock”. Internals (`internal/*`) glue config together; they are not
 * part of the public API so constants and presets do not leak into components.
 *
 * ## API surface
 *
 * Use **getters** for `Date` values and **format\*** functions for user-visible strings. Pass
 * `locale` from `useLocale()` / `getLocale()` into the formatters.
 */

export {
    getCelebrationStartDate,
    getRsvpDeadlineDate,
    getWeddingCeremonyDate,
    isCelebrationLive,
} from './internal/resolve-instants'

export {
    formatHeroWeddingLine,
    formatHeroWeddingStartTime,
    formatRsvpDeadlineLine,
    formatScheduleClock,
    formatStoryWeddingLine,
} from './internal/locale-strings'

export {
    resolveScheduleItems,
    type ScheduleIconId,
    type ScheduleIconRender,
    type ScheduleItem,
    type ScheduleTimelineRow,
} from './internal/schedule-model'
