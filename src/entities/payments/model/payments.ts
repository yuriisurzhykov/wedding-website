import {buildCashAppUrls, buildPayPalUrls, buildVenmoUrls} from './build-payment-links'
import {parseCashAppCashtag, parsePayPalMeHandle, parseVenmoUsername, parseZellePhone,} from './payment-credentials'

export type PaymentService = 'venmo' | 'cashapp' | 'paypal' | 'zelle'

export interface PaymentConfig {
    id: PaymentService
    label: string
    icon: string
    deepLink: string
    fallback: string
    /** Tailwind classes for button background */
    color: string
    /** Set only for Zelle — normalized digits for clipboard */
    zellePhone?: string
}

const VENMO_USERNAME_RAW = process.env.PAYMENTS_VENMO_USERNAME?.trim() ?? ''
const CASHAPP_TAG_RAW = process.env.PAYMENTS_CASHAPP_TAG?.trim() ?? ''
const PAYPAL_ME_RAW = process.env.PAYMENTS_PAYPAL_ID?.trim() ?? ''
const ZELLE_PHONE_RAW = process.env.PAYMENTS_ZELLE_PHONE?.trim() ?? ''

function buildPaymentServices(): PaymentConfig[] {
    const out: PaymentConfig[] = []

    const venmoUser = parseVenmoUsername(VENMO_USERNAME_RAW)
    if (venmoUser) {
        const {deepLink, fallback} = buildVenmoUrls(venmoUser)
        out.push({
            id: 'venmo',
            label: 'Venmo',
            icon: '💜',
            deepLink,
            fallback,
            color: 'bg-[#3D95CE]',
        })
    }

    const cashTag = parseCashAppCashtag(CASHAPP_TAG_RAW)
    if (cashTag) {
        const {deepLink, fallback} = buildCashAppUrls(cashTag)
        out.push({
            id: 'cashapp',
            label: 'Cash App',
            icon: '💚',
            deepLink,
            fallback,
            color: 'bg-[#00D632]',
        })
    }

    const paypalHandle = parsePayPalMeHandle(PAYPAL_ME_RAW)
    if (paypalHandle) {
        const {deepLink, fallback} = buildPayPalUrls(paypalHandle)
        out.push({
            id: 'paypal',
            label: 'PayPal',
            icon: '🔵',
            deepLink,
            fallback,
            color: 'bg-[#003087]',
        })
    }

    const zelleDigits = parseZellePhone(ZELLE_PHONE_RAW)
    if (zelleDigits) {
        out.push({
            id: 'zelle',
            label: 'Zelle',
            icon: '🏦',
            deepLink: '',
            fallback: '',
            color: 'bg-[#6D1ED4]',
            zellePhone: zelleDigits,
        })
    }

    return out
}

export const PAYMENT_SERVICES: PaymentConfig[] = buildPaymentServices()

/** Normalized Zelle phone when configured; empty string otherwise. */
export const ZELLE_PHONE_NUMBER: string =
    PAYMENT_SERVICES.find((s) => s.id === 'zelle')?.zellePhone ?? ''

function isValidHttpsPaymentUrl(url: string): boolean {
    try {
        const u = new URL(url)
        if (u.protocol !== 'https:' || u.hostname.length === 0) return false
        // Reject bare origin without a meaningful path (e.g. https://paypal.me/)
        return u.pathname.length > 1
    } catch {
        return false
    }
}

function isValidVenmoDeepLink(url: string): boolean {
    try {
        const u = new URL(url)
        if (u.protocol !== 'venmo:' || u.hostname !== 'paycharge') return false
        const recipients = u.searchParams.get('recipients')
        return Boolean(recipients && recipients.length > 0)
    } catch {
        return false
    }
}

/**
 * True when the service has non-empty, well-formed URLs (or Zelle phone).
 * Use after building from env, or to guard against malformed configs.
 */
export function isPaymentConfigured(service: PaymentConfig): boolean {
    if (service.id === 'zelle') {
        const phone = service.zellePhone ?? ''
        return phone.length > 0 && parseZellePhone(phone) === phone
    }

    if (!service.deepLink?.trim() || !service.fallback?.trim()) return false

    if (service.id === 'venmo') {
        return isValidVenmoDeepLink(service.deepLink) && isValidHttpsPaymentUrl(service.fallback)
    }

    return (
        isValidHttpsPaymentUrl(service.deepLink) &&
        isValidHttpsPaymentUrl(service.fallback) &&
        service.deepLink === service.fallback
    )
}
