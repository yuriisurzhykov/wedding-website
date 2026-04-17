import "server-only";

/**
 * Parses a `From` line into display name + bare address (best-effort).
 */
export function parseRfc5322From(from: string): {
    address: string;
    name: string | null;
} {
    const trimmed = from.trim();
    const angle = trimmed.match(/^(.+?)\s*<([^>]+)>\s*$/);
    if (angle) {
        const rawName = angle[1].trim().replace(/^["']|["']$/g, "").trim();
        return {
            address: angle[2].trim(),
            name: rawName.length > 0 ? rawName : null,
        };
    }
    return {address: trimmed, name: null};
}
