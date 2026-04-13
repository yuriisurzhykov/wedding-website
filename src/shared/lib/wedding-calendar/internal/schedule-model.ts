import {getProgramInstantOnWeddingDay} from './resolve-instants'

/** Preset ids supported by {@link getScheduleIcon} in `@shared/ui/icons/schedule`. */
export type ScheduleIconId = 'gathering' | 'ceremony' | 'reception' | 'dinner'

/**
 * How the timeline renders the icon for one row (preset component, sanitized inline SVG, or image URL).
 *
 * For {@link ScheduleIconRender.kind} `url`, `alt` is passed to `<img alt>` — use `''` when the icon is
 * decorative (redundant with the row title); a non-empty string exposes the image to assistive tech.
 */
export type ScheduleIconRender =
    | {kind: 'preset'; iconId: ScheduleIconId}
    | {kind: 'inline'; svgHtml: string}
    | {kind: 'url'; href: string; alt: string}

/** Wall-clock program row for the guest timeline (copy resolved server-side for the active locale). */
export type ScheduleTimelineRow = {
    id: string
    hour: number
    minute: number
    title: string
    desc: string
    location: string
    locationUrl: string
    /** Visual “main” timeline node (at most one row per program). */
    emphasis: boolean
    icon: ScheduleIconRender
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
