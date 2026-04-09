/**
 * Accepts an optional marketing/transactional URL string.
 *
 * @returns Trimmed `http://` or `https://` URL, or `undefined` when missing or not absolute http(s).
 */
export function normalizeOptionalHttpsUrl(
    raw: string | undefined,
): string | undefined {
    const t = raw?.trim();
    if (
        !t ||
        (!t.startsWith("http://") && !t.startsWith("https://"))
    ) {
        return undefined;
    }
    return t.replace(/\/+$/, "");
}
