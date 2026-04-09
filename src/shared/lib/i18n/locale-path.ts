import {routing} from "@/i18n/routing";

/**
 * Builds the pathname segment for a locale using `localePrefix: 'as-needed'`.
 * The default locale has **no** leading `/{locale}` prefix; others use `/{locale}{path}`.
 *
 * @param locale — BCP-style locale key (e.g. `en`, `ru`); must match `i18n/routing`.
 * @param path — App path **without** locale, e.g. `''` for home, `'/gallery'`, `'/guest/claim'`.
 */
export function pathForLocale(locale: string, path: string): string {
    const suffix = path === "" ? "" : path;
    if (
        locale === routing.defaultLocale &&
        routing.localePrefix === "as-needed"
    ) {
        return suffix === "" ? "" : suffix;
    }
    return `/${locale}${suffix}`;
}

/**
 * Joins a site origin (no trailing slash) with a pathname.
 *
 * @param base — Origin or absolute base, e.g. `https://example.com` (trailing slashes stripped).
 * @param pathname — Path starting with `/`, or `''` / `'/'` for the site root (yields `{base}/`).
 */
export function toAbsoluteUrl(base: string, pathname: string): string {
    const normalized = pathname.replace(/\/+/g, "/");
    const b = base.replace(/\/+$/, "");
    if (normalized === "" || normalized === "/") {
        return `${b}/`;
    }
    return `${b}${normalized.startsWith("/") ? normalized : `/${normalized}`}`;
}
