import {DAY_PROGRAM_TIMELINE} from '../config/day-program'
import {getProgramInstantOnWeddingDay} from './resolve-instants'

export type DayProgramRow = (typeof DAY_PROGRAM_TIMELINE)[number]

/** Wall-clock program row (e.g. from `day-program.ts` or `site_settings.schedule_program`). */
export type ScheduleTimelineRow = {
    id: string
    iconId: string
    hour: number
    minute: number
    titleKey: string
    descKey: string
    location: string
    locationUrl: string
    /** Visual “main” timeline node (at most one row per program). */
    emphasis: boolean
}

export type ScheduleItem = ScheduleTimelineRow & { instant: Date }

/**
 * Builds {@link ScheduleItem} list with wedding-day instants from any program rows (DB or code defaults).
 * Empty input yields an empty list; callers typically pass a non-empty program from site settings (with fallback).
 */
export function resolveScheduleItems(rows: readonly ScheduleTimelineRow[]): ScheduleItem[] {
    return rows.map((row) => ({
        ...row,
        instant: getProgramInstantOnWeddingDay(row.hour, row.minute),
    }))
}

export function getScheduleItems(): ScheduleItem[] {
    return resolveScheduleItems(DAY_PROGRAM_TIMELINE)
}
