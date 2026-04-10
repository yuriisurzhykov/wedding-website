/**
 * Parse and validate payment identifiers from env (pure, no I/O).
 * Invalid or placeholder values return null so we do not surface half-built URLs.
 */

const VENMO_USERNAME = /^[a-zA-Z0-9_-]{3,100}$/

/** Cashtag after optional leading $ (letters, digits, underscore). */
const CASHAPP_CASHTAG = /^[a-zA-Z][a-zA-Z0-9_]{0,49}$/

/** paypal.me path segment (handle). */
const PAYPAL_ME_HANDLE = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,99}$/

/**
 * @returns Normalized Venmo username (no @), or null if invalid.
 */
export function parseVenmoUsername(raw: string): string | null {
    const s = raw.trim().replace(/^@+/, '')
    if (!s || !VENMO_USERNAME.test(s)) return null
    return s
}

/**
 * @returns Normalized Cash App cashtag without leading $, or null.
 */
export function parseCashAppCashtag(raw: string): string | null {
    const s = raw.trim().replace(/^\$+/, '')
    if (!s || !CASHAPP_CASHTAG.test(s)) return null
    return s
}

/**
 * Accepts a handle or a pasted `https://paypal.me/handle` URL.
 * @returns Path segment for paypal.me, or null.
 */
export function parsePayPalMeHandle(raw: string): string | null {
    let s = raw.trim()
    if (!s) return null

    const lower = s.toLowerCase()
    if (lower.startsWith('https://paypal.me/')) {
        s = s.slice('https://paypal.me/'.length)
    } else if (lower.startsWith('http://paypal.me/')) {
        s = s.slice('http://paypal.me/'.length)
    }
    const segment = s.replace(/^\/+/, '').split('/')[0] ?? ''
    if (!segment || !PAYPAL_ME_HANDLE.test(segment)) return null
    return segment
}

/**
 * @returns Digits-only US-style phone (10+ digits), or null.
 */
export function parseZellePhone(raw: string): string | null {
    const digits = raw.replace(/\D/g, '')
    if (digits.length < 10 || digits.length > 15) return null
    return digits
}
