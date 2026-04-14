import {DISPLAY_FORMATS} from '../config/event-display'
import {hour12ForSiteLocale, toIntlBcp47ForSiteLocale} from './intl-locale'
import {getRsvpDeadlineDate, getWeddingCeremonyDate,} from './resolve-instants'

/** All `format*` helpers must use this instead of `new Intl.DateTimeFormat(locale, …)` with a raw site segment. */
function siteDateTimeFormat(
    siteLocale: string,
    options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat {
    return new Intl.DateTimeFormat(toIntlBcp47ForSiteLocale(siteLocale), options)
}

export function formatHeroWeddingStartTime(locale: string): string {
    return siteDateTimeFormat(locale, {
        ...DISPLAY_FORMATS.heroWeddingStartTime,
        hour12: hour12ForSiteLocale(locale),
    }).format(getWeddingCeremonyDate())
}

export function formatHeroWeddingLine(locale: string): string {
    return siteDateTimeFormat(locale, DISPLAY_FORMATS.heroWeddingLine).format(
        getWeddingCeremonyDate(),
    )
}

export function formatStoryWeddingLine(locale: string): string {
    return siteDateTimeFormat(locale, DISPLAY_FORMATS.storyWeddingLine).format(
        getWeddingCeremonyDate(),
    )
}

export function formatRsvpDeadlineLine(locale: string): string {
    return siteDateTimeFormat(locale, DISPLAY_FORMATS.rsvpDeadlineLine).format(
        getRsvpDeadlineDate(),
    )
}

/**
 * Time-of-day only for schedule cells. UTC anchor + fixed options → identical SSR anywhere.
 */
export function formatScheduleClock(locale: string, hour: number, minute: number): string {
    const anchor = new Date(Date.UTC(2000, 0, 1, hour, minute, 0))
    return siteDateTimeFormat(locale, {
        ...DISPLAY_FORMATS.scheduleClock,
        hour12: hour12ForSiteLocale(locale),
    }).format(anchor)
}
