/**
 * Venue/contact live here. Ceremony & RSVP instants live in `@/lib/wedding-calendar`
 * (re-exported below for routes or scripts that need `Date` without importing the package root).
 */
export {getRsvpDeadlineDate, getWeddingCeremonyDate} from './wedding-calendar'

export const VENUE = {
    name: '',
    address: '23501 NE 120th Ct, Battle Ground, WA 98604',
    mapsUrl:
        'https://www.google.com/maps/place/23501+NE+120th+Ct,+Battle+Ground,+WA+98604/@45.7920364,-122.5493327,16z',
    parkingNote: 'Valet and street parking nearby; please allow a few extra minutes at rush hour.',
}

export const CONTACT = {
    email: 'hello@yuriimariia.wedding',
    phone: '+380 (67) 123-45-67',
}
