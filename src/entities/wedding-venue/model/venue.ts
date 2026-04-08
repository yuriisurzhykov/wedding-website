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

export const CONTACT: ContactInfo = {
    email: 'hello@yuriimariia.wedding',
    phone: '+380 (67) 123-45-67',
}
