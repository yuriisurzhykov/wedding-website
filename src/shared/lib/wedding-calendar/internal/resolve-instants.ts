import {WEDDING_INSTANTS, type WeddingInstantId} from '../config/instants'
import {getCeremonyCalendarDayAndOffset} from './ceremony-calendar'

export function parseWeddingInstant(id: WeddingInstantId): Date {
    return new Date(WEDDING_INSTANTS[id])
}

let cachedCeremony: Date | undefined
let cachedCelebrationStart: Date | undefined
let cachedRsvp: Date | undefined

/** Ceremony instant — countdowns, comparisons. Cached (immutable config). */
export function getWeddingCeremonyDate(): Date {
    return (cachedCeremony ??= parseWeddingInstant('weddingCeremony'))
}

/** Start of the celebration segment — feature gating (e.g. gallery). Cached (immutable config). */
export function getCelebrationStartDate(): Date {
    return (cachedCelebrationStart ??= parseWeddingInstant('celebrationStart'))
}

/**
 * Whether the celebration period has begun (`now` ≥ {@link getCelebrationStartDate}).
 * Pass `now` for tests or to align with a shared clock; defaults to the current time.
 */
export function isCelebrationLive(now: Date = new Date()): boolean {
    return now.getTime() >= getCelebrationStartDate().getTime()
}

export function getRsvpDeadlineDate(): Date {
    return (cachedRsvp ??= parseWeddingInstant('rsvpDeadline'))
}

/** Wall time on the wedding calendar day, same date/offset as ceremony ISO. */
export function getProgramInstantOnWeddingDay(hour: number, minute: number): Date {
    const {day, offset} = getCeremonyCalendarDayAndOffset()
    const pad = (n: number) => String(n).padStart(2, '0')
    return new Date(`${day}T${pad(hour)}:${pad(minute)}:00${offset}`)
}
