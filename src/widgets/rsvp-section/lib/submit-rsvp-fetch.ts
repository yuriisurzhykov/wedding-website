/**
 * Client-only helper: POST RSVP JSON to `/api/rsvp` (same keys as the site RSVP form).
 *
 * @param body — Serialized with `JSON.stringify` (typically form values including `attending`).
 */
export async function submitRsvpFetch(body: Record<string, unknown>): Promise<void> {
    const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        throw new Error(`RSVP request failed: ${res.status}`);
    }
}
