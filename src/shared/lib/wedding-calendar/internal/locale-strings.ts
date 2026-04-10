import {DISPLAY_FORMATS} from '../config/event-display'
import {getRsvpDeadlineDate, getWeddingCeremonyDate,} from './resolve-instants'

export function formatHeroWeddingLine(locale: string): string {
    return new Intl.DateTimeFormat(locale, DISPLAY_FORMATS.heroWeddingLine).format(
        getWeddingCeremonyDate(),
    )
}

export function formatStoryWeddingLine(locale: string): string {
    return new Intl.DateTimeFormat(locale, DISPLAY_FORMATS.storyWeddingLine).format(
        getWeddingCeremonyDate(),
    )
}

export function formatRsvpDeadlineLine(locale: string): string {
    return new Intl.DateTimeFormat(locale, DISPLAY_FORMATS.rsvpDeadlineLine).format(
        getRsvpDeadlineDate(),
    )
}

/**
 * Time-of-day only for schedule cells. UTC anchor + fixed options → identical SSR anywhere.
 */
export function formatScheduleClock(locale: string, hour: number, minute: number): string {
    const anchor = new Date(Date.UTC(2000, 0, 1, hour, minute, 0))
    return new Intl.DateTimeFormat(locale, DISPLAY_FORMATS.scheduleClock).format(anchor)
}
