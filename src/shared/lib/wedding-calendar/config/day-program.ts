/**
 * Ordered day-of program: wall-clock hours on the wedding calendar day, i18n keys, map links.
 *
 * **Edit this file only** when the *program* changes (times, order, copy keys, venues).
 * The calendar date and UTC offset for wall times are taken from `weddingCeremony` in
 * `instants.ts` — do not duplicate `YYYY-MM-DD` or `±HH:mm` here.
 *
 * Map URL is duplicated from `@entities/wedding-venue` `VENUE.mapsUrl` on purpose to avoid importing
 * `constants` (that module re-exports wedding-calendar and would create a cycle).
 */

const VENUE_MAPS_URL =
    'https://www.google.com/maps/place/23501+NE+120th+Ct,+Battle+Ground,+WA+98604/@45.7920364,-122.5493327,16z'

export const DAY_PROGRAM_TIMELINE = [
    {
        id: 'gathering',
        iconId: 'gathering',
        hour: 14,
        minute: 0,
        titleKey: 'schedule.items.gathering.title',
        descKey: 'schedule.items.gathering.desc',
        location: 'WGBC Battle Ground — welcome area',
        locationUrl: VENUE_MAPS_URL,
    },
    {
        id: 'ceremony',
        iconId: 'ceremony',
        hour: 15,
        minute: 0,
        titleKey: 'schedule.items.ceremony.title',
        descKey: 'schedule.items.ceremony.desc',
        location: 'WGBC Battle Ground — ceremony',
        locationUrl: VENUE_MAPS_URL,
    },
    {
        id: 'reception',
        iconId: 'reception',
        hour: 17,
        minute: 0,
        titleKey: 'schedule.items.reception.title',
        descKey: 'schedule.items.reception.desc',
        location: 'WGBC Battle Ground — reception',
        locationUrl: VENUE_MAPS_URL,
    },
    {
        id: 'dinner',
        iconId: 'dinner',
        hour: 18,
        minute: 0,
        titleKey: 'schedule.items.dinner.title',
        descKey: 'schedule.items.dinner.desc',
        location: 'WGBC Battle Ground — celebration',
        locationUrl: VENUE_MAPS_URL,
    },
] as const
