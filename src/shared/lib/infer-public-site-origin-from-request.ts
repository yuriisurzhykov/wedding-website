/**
 * Builds `https://host` (or `http://` for localhost) from reverse-proxy / browser request headers.
 * Used when `NEXT_PUBLIC_SITE_URL` is unset (typical local dev) so transactional emails still get absolute links.
 */

/**
 * @returns Origin without trailing slash, or `undefined` if `Host` cannot be determined.
 */
export function inferPublicSiteOriginFromRequest(request: Request): string | undefined {
    const hostRaw =
        request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ??
        request.headers.get("host")?.trim();
    if (!hostRaw) {
        return undefined;
    }

    const protoRaw =
        request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
    const localhost = /^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(
        hostRaw,
    );
    const proto =
        protoRaw === "http" || protoRaw === "https"
            ? protoRaw
            : localhost
              ? "http"
              : "https";

    try {
        const u = new URL(`${proto}://${hostRaw}`);
        return u.origin.replace(/\/+$/, "");
    } catch {
        return undefined;
    }
}
