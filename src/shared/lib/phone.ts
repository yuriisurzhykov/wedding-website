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
 * Reduces arbitrary input to 0–10 US NANP national digits (no country code) for display/validation prep.
 *
 * - Digits only; extra non-digits ignored.
 * - 11+ digits with leading `1`: take the next 10 digits after `1` (E.164 / `+1…`), ignoring extra trailing noise.
 * - More than 10 digits without that pattern: keep the first 10 (trim paste overflow).
 * - 2–10 digits with leading `1`: strip one leading `1` (in-progress `+1` …).
 * - A lone `1` is kept so `(555)` masking can proceed after `+1`.
 *
 * Examples: `+1 (555) 123-4567` → `5551234567`; `5551234567` → `5551234567`; `1555123456789` → `5551234567`.
 */
export function normalizeToUsNanpNationalDigits(value: string): string {
    const digits = value.replace(/\D/g, '')
    if (!digits) return ''
    if (digits.length >= 11 && digits[0] === '1') {
        return digits.slice(1, 11)
    }
    if (digits.length > 10) {
        return digits.slice(0, 10)
    }
    if (digits.length > 1 && digits[0] === '1') {
        return digits.slice(1)
    }
    return digits
}

/**
 * US-style mask while typing, e.g. `(555) 123-4567`.
 * Normalizes to NANP national digits first so paste, autofill, and long input stay stable.
 */
export function formatPhoneAsYouType(value: string): string {
    const national = normalizeToUsNanpNationalDigits(value)
    if (!national) return ''
    const formatter = new AsYouType(US)
    let formatted = ''
    for (const ch of national) {
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
