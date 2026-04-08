export type PaymentService = 'venmo' | 'cashapp' | 'paypal' | 'zelle'

export interface PaymentConfig {
    id: PaymentService
    label: string
    icon: string
    deepLink: string
    fallback: string
    /** Tailwind classes for button background */
    color: string
}

const VENMO_USERNAME = process.env.PAYMENTS_VENMO_USERNAME?.trim() ?? ''
const CASHAPP_TAG = process.env.PAYMENTS_CASHAPP_TAG?.trim() ?? ''
const PAYPAL_ME = process.env.PAYMENTS_PAYPAL_ID?.trim() ?? ''
const ZELLE_PHONE = process.env.PAYMENTS_ZELLE_PHONE?.trim() ?? ''

export const PAYMENT_SERVICES: PaymentConfig[] = [
    {
        id: 'venmo',
        label: 'Venmo',
        icon: '💜',
        deepLink: `venmo://paycharge?txn=pay&recipients=${VENMO_USERNAME}&note=Wedding%20Gift%20💍`,
        fallback: `https://venmo.com/${VENMO_USERNAME}`,
        color: 'bg-[#3D95CE]',
    },
    {
        id: 'cashapp',
        label: 'Cash App',
        icon: '💚',
        deepLink: `https://cash.app/${CASHAPP_TAG}`,
        fallback: `https://cash.app/${CASHAPP_TAG}`,
        color: 'bg-[#00D632]',
    },
    {
        id: 'paypal',
        label: 'PayPal',
        icon: '🔵',
        deepLink: `https://paypal.me/${PAYPAL_ME}`,
        fallback: `https://paypal.me/${PAYPAL_ME}`,
        color: 'bg-[#003087]',
    },
    {
        id: 'zelle',
        label: 'Zelle',
        icon: '🏦',
        deepLink: '',
        fallback: '',
        color: 'bg-[#6D1ED4]',
    },
]

export const ZELLE_PHONE_NUMBER = ZELLE_PHONE
