/**
 * Stable BCP-47 tags and clock conventions for `Intl` formatters driven by the site language
 * (`i18n/routing.ts`: `en`, `ru`). URL segments stay short; `Intl` gets explicit regions.
 */

export type IntlBcp47ForSite = 'en-US' | 'ru-RU'

/**
 * Maps `getLocale()` / `useLocale()` values to tags passed as the first argument of `Intl.DateTimeFormat`.
 *
 * - `en` (and `en-*`) → `en-US` — US date order where `dateStyle` applies; 12h when we enable it.
 * - `ru` (and `ru-*`) → `ru-RU` — long Russian month names; 24h for clock fields.
 *
 * Unknown values default to `en-US`, matching `routing.defaultLocale`.
 */
export function toIntlBcp47ForSiteLocale(siteLocale: string): IntlBcp47ForSite {
    const tag = siteLocale.trim().toLowerCase()
    if (tag === 'ru' || tag.startsWith('ru-')) {
        return 'ru-RU'
    }
    return 'en-US'
}

/**
 * Single policy for numeric hour/minute fields: 12-hour clock on the English site only.
 */
export function hour12ForSiteLocale(siteLocale: string): boolean {
    return toIntlBcp47ForSiteLocale(siteLocale) === 'en-US'
}
