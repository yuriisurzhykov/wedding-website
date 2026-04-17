import "server-only";

/**
 * Case-insensitive lookup in a headers map (Resend may normalize casing).
 */
export function mailHeaderLookup(
    headers: Record<string, string> | undefined,
    canonicalName: string,
): string | null {
    if (!headers) {
        return null;
    }
    const want = canonicalName.toLowerCase();
    for (const [k, v] of Object.entries(headers)) {
        if (k.toLowerCase() === want) {
            return v;
        }
    }
    return null;
}
