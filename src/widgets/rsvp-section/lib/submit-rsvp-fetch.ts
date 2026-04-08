/**
 * Client-only helper: POST RSVP JSON to `/api/rsvp` (same keys as the site RSVP form).
 *
 * @param body — Serialized with `JSON.stringify` (typically form values including `attending`).
 */

export class RsvpNotificationError extends Error {
    readonly step: "admin" | "guest";
    readonly id: string;

    constructor(step: "admin" | "guest", id: string) {
        super(`RSVP notification failed at step ${step}`);
        this.name = "RsvpNotificationError";
        this.step = step;
        this.id = id;
    }
}

function isNotificationFailurePayload(
    data: unknown,
): data is {error: string; step: "admin" | "guest"; id: string} {
    if (!data || typeof data !== "object") return false;
    const o = data as Record<string, unknown>;
    return (
        o.error === "notification_failed" &&
        (o.step === "admin" || o.step === "guest") &&
        typeof o.id === "string"
    );
}

export async function submitRsvpFetch(body: Record<string, unknown>): Promise<void> {
    const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(body),
    });

    let data: unknown;
    try {
        data = await res.json();
    } catch {
        data = null;
    }

    if (!res.ok) {
        if (res.status === 502 && isNotificationFailurePayload(data)) {
            throw new RsvpNotificationError(data.step, data.id);
        }
        throw new Error(`RSVP request failed: ${res.status}`);
    }
}
