import {toDialString} from '@shared/lib/phone'

export interface VenueInfo {
    name: string
    address: string
    mapsUrl: string
    parkingNote: string
}

export const VENUE: VenueInfo = {
    name: '',
    address: '23501 NE 120th Ct, Battle Ground, WA 98604',
    mapsUrl:
        'https://www.google.com/maps/place/23501+NE+120th+Ct,+Battle+Ground,+WA+98604/@45.7920364,-122.5493327,16z',
    parkingNote:
        'Valet and street parking nearby; please allow a few extra minutes at rush hour.',
}

export interface ContactInfo {
    email: string
    phone: string
}

const contactFacts: ContactInfo = {
    email: 'contact@yuriimariia.wedding',
    phone: '+1 (916)-517-2011',
}

/**
 * Public contact facts for the wedding (phone display string and email).
 */
export function getContactInfo(): Readonly<ContactInfo> {
    return contactFacts
}

function mailtoHrefForEmail(email: string): string {
    const e = email.trim()
    return `mailto:${e}`
}

/**
 * `tel:` href for the configured contact phone, or `undefined` when dialing is not derivable.
 */
export function getContactTelHref(): string | undefined {
    const dial = toDialString(contactFacts.phone)
    return dial ? `tel:${dial}` : undefined
}

/** `mailto:` href for the configured contact email. */
export function getContactMailtoHref(): string {
    return mailtoHrefForEmail(contactFacts.email)
}
