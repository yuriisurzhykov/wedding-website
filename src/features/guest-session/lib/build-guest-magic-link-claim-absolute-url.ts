import "server-only";

/**
 * Builds the absolute **`GET /api/guest/claim`** URL with `token` and `locale` query params.
 * Pure string composition (no I/O).
 */
export function buildGuestMagicLinkClaimAbsoluteUrl(
    siteBaseUrl: string,
    rawToken: string,
    locale: "en" | "ru",
): string {
    const base = siteBaseUrl.replace(/\/+$/, "");
    const params = new URLSearchParams({
        token: rawToken,
        locale,
    });
    return `${base}/api/guest/claim?${params.toString()}`;
}
