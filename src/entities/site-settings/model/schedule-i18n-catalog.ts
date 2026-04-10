import {DAY_PROGRAM_TIMELINE} from '@shared/lib/wedding-calendar/config/day-program'

/**
 * Icons supported by {@link getScheduleIcon} — must match `day-program` / schedule UI.
 */
export const SCHEDULE_PROGRAM_ICON_IDS = [
    'gathering',
    'ceremony',
    'reception',
    'dinner',
] as const

export type ScheduleProgramIconId = (typeof SCHEDULE_PROGRAM_ICON_IDS)[number]

/**
 * Preset pairs of `titleKey` / `descKey` (and suggested `iconId`) for admin UI — sourced from
 * {@link DAY_PROGRAM_TIMELINE} so the catalog stays aligned with `messages/*` schedule copy.
 */
export const SCHEDULE_I18N_CATALOG = DAY_PROGRAM_TIMELINE.map((row) => ({
    segmentId: row.id,
    iconId: row.iconId,
    titleKey: row.titleKey,
    descKey: row.descKey,
}))

export type ScheduleI18nCatalogEntry = (typeof SCHEDULE_I18N_CATALOG)[number]

export function getCatalogEntryBySegmentId(
    segmentId: string,
): ScheduleI18nCatalogEntry | undefined {
    return SCHEDULE_I18N_CATALOG.find((e) => e.segmentId === segmentId)
}
