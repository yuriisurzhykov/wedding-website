/**
 * How dates and clock times are *shown* (IANA zone + `Intl` option bundles).
 *
 * **Edit this file only** when presentation rules change: e.g. move to another region,
 * switch long vs short date style, or change 12h/24h in the schedule column.
 *
 * `EVENT_DISPLAY_TIMEZONE` drives calendar-style strings; ISO strings in `instants.ts`
 * still define the exact instants used for countdowns.
 */

export const EVENT_DISPLAY_TIMEZONE = 'America/Los_Angeles'

export const DISPLAY_FORMATS = {
    /** Weekday + full date in the event zone — richer than `long` for the hero. */
    heroWeddingLine: {
        dateStyle: 'full',
        timeZone: EVENT_DISPLAY_TIMEZONE,
    },
    storyWeddingLine: {
        dateStyle: 'long',
        timeZone: EVENT_DISPLAY_TIMEZONE,
    },
    rsvpDeadlineLine: {
        dateStyle: 'long',
        timeZone: EVENT_DISPLAY_TIMEZONE,
    },
    scheduleClock: {
        hour: 'numeric',
        minute: '2-digit',
        hour12: false,
        timeZone: 'UTC',
    },
} as const satisfies Record<string, Intl.DateTimeFormatOptions>
