import {WEDDING_INSTANTS} from '../config/instants'

const ISO_LOCAL_DATE = /^(\d{4}-\d{2}-\d{2})T/
const ISO_OFFSET_SUFFIX = /([+-]\d{2}:\d{2})$/

/**
 * Calendar `YYYY-MM-DD` and numeric offset suffix from the ceremony ISO.
 * Keeps schedule wall times aligned with the ceremony row without re-entering the date.
 */
export function getCeremonyCalendarDayAndOffset(): {day: string; offset: string} {
    const iso = WEDDING_INSTANTS.weddingCeremony
    const day = ISO_LOCAL_DATE.exec(iso)?.[1]
    const offset = ISO_OFFSET_SUFFIX.exec(iso)?.[1]
    if (!day || !offset) {
        throw new Error(`wedding-calendar: invalid weddingCeremony ISO: ${iso}`)
    }
    return {day, offset}
}
