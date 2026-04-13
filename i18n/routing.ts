import {defineRouting} from 'next-intl/routing'

/**
 * `defaultLocale` sets which locale omits a prefix with `localePrefix: 'as-needed'`
 * and is the fallback when `Accept-Language` does not list `ru`, `uk`, or `en`.
 * First-time language between Russian and English is negotiated in middleware from
 * the browser header (see `@shared/lib/i18n/negotiate-site-locale`).
 */
export const routing = defineRouting({
    locales: ['ru', 'en'],
    defaultLocale: 'en',
    localePrefix: 'as-needed',
})
