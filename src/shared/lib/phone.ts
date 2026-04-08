import {AsYouType, parsePhoneNumberFromString} from 'libphonenumber-js'

/** RSVP phone: US (NANP) only, regardless of site locale. */
const US: 'US' = 'US'

/**
 * Strips decorative characters; keeps a single leading `+` then digits.
 */
export function toDialString(value: string): string {
    const t = value.trim()
    if (!t) return ''
    if (t.startsWith('+')) {
        return `+${t.slice(1).replace(/\D/g, '')}`
    }
    return t.replace(/\D/g, '')
}

/**
 * US-style mask while typing, e.g. `(555) 123-4567` or `+1 555 123 4567`.
 */
export function formatPhoneAsYouType(value: string): string {
    const dial = toDialString(value)
    if (!dial) return ''
    const formatter = new AsYouType(US)
    let formatted = ''
    for (const ch of dial) {
        formatted = formatter.input(ch)
    }
    return formatted
}

/**
 * Non-empty string must be a valid US phone number (including `+1` E.164 input).
 */
export function isUsPhoneValid(phone: string): boolean {
    const trimmed = phone.trim()
    if (!trimmed) return false
    const parsed = parsePhoneNumberFromString(trimmed, US)
    return Boolean(parsed?.isValid() && parsed.country === US)
}

/**
 * Normalizes a valid US phone to E.164 (`+1…`). Returns `undefined` if input is empty.
 */
export function normalizeUsPhoneToE164(phone: string): string | undefined {
    const trimmed = phone.trim()
    if (!trimmed) return undefined
    const parsed = parsePhoneNumberFromString(trimmed, US)
    if (!parsed?.isValid() || parsed.country !== US) return undefined
    return parsed.format('E.164')
}
