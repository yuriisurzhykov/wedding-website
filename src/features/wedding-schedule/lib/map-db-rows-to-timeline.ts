import type {ScheduleItemRow} from '@entities/wedding-schedule'
import {scheduleIconPresetSchema} from '@entities/wedding-schedule'
import type {ScheduleIconRender, ScheduleTimelineRow} from '@shared/lib/wedding-calendar'

function resolveGuestIcon(row: ScheduleItemRow): ScheduleIconRender {
    if (row.icon_preset != null) {
        const preset = scheduleIconPresetSchema.safeParse(row.icon_preset)
        if (preset.success) {
            return {kind: 'preset', iconId: preset.data}
        }
    }
    const url = row.icon_url?.trim()
    if (url) {
        return {kind: 'url', href: url, alt: ''}
    }
    const inline = row.icon_svg_inline?.trim()
    if (inline) {
        return {kind: 'inline', svgHtml: inline}
    }
    return {kind: 'preset', iconId: 'gathering'}
}

/** Maps DB rows to guest timeline rows for the active locale. */
export function mapScheduleItemsToTimelineRows(
    rows: ScheduleItemRow[],
    locale: string,
): ScheduleTimelineRow[] {
    const useRu = locale === 'ru'
    return rows.map((row) => ({
        id: row.id,
        hour: row.hour,
        minute: row.minute,
        title: useRu ? row.title_ru : row.title_en,
        desc: useRu ? row.desc_ru : row.desc_en,
        location: row.location,
        locationUrl: row.location_url,
        emphasis: row.emphasis,
        icon: resolveGuestIcon(row),
    }))
}
