const WEDDING_NOTE = 'Wedding Gift 💍'

/**
 * Venmo app deep link + HTTPS profile/pay page (fallback after timeout in UI).
 */
export function buildVenmoUrls(username: string): { deepLink: string; fallback: string } {
    const note = encodeURIComponent(WEDDING_NOTE)
    const recipients = encodeURIComponent(username)
    const deepLink = `venmo://paycharge?txn=pay&recipients=${recipients}&note=${note}`
    const fallback = `https://venmo.com/${encodeURIComponent(username)}`
    return {deepLink, fallback}
}

/**
 * Cash App uses the same HTTPS URL for in-app and browser (`https://cash.app/$Cashtag`).
 */
export function buildCashAppUrls(cashtagWithoutDollar: string): {
    deepLink: string
    fallback: string
} {
    const url = `https://cash.app/$${encodeURIComponent(cashtagWithoutDollar)}`
    return {deepLink: url, fallback: url}
}

export function buildPayPalUrls(handle: string): { deepLink: string; fallback: string } {
    const url = `https://paypal.me/${encodeURIComponent(handle)}`
    return {deepLink: url, fallback: url}
}
