import 'server-only'

import {
    type ScheduleItem,
    resolveScheduleItems,
} from '@shared/lib/wedding-calendar'

import {mapScheduleItemsToTimelineRows} from '../lib/map-db-rows-to-timeline'
import {resolveScheduleSectionHeaders} from '../lib/resolve-schedule-section-headers'
import {getWeddingScheduleCached} from './get-wedding-schedule'

export type ResolvedGuestSchedule = Readonly<{
    sectionHeaders: ReturnType<typeof resolveScheduleSectionHeaders>
    items: ScheduleItem[]
}>

/**
 * Loads the wedding schedule from Postgres (cached) and resolves copy for the active locale.
 * Use from RSC (e.g. home page) instead of wiring `getWeddingScheduleCached` + mappers at the page level.
 */
export async function getResolvedGuestSchedule(locale: string): Promise<ResolvedGuestSchedule> {
    const snapshot = await getWeddingScheduleCached()
    return {
        sectionHeaders: resolveScheduleSectionHeaders(snapshot.section, locale),
        items: resolveScheduleItems(mapScheduleItemsToTimelineRows(snapshot.items, locale)),
    }
}
