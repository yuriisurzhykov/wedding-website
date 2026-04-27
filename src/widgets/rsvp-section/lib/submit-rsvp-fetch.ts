/**
 * Client-only helper: POST RSVP JSON to `/api/rsvp` (same keys as the site RSVP form).
 *
 * @param body — Serialized with `JSON.stringify` (typically form values including `attending`).
 */

import type {ApplyGuestSessionFromApiBody, GuestSessionClientSnapshot} from "@features/guest-session";

function extractGuestSessionFromRsvpJson(data: unknown): Parameters<
    ApplyGuestSessionFromApiBody
>[0] {
    if (!data || typeof data !== "object") {
        return {sessionEstablished: false};
    }
    const o = data as Record<string, unknown>;
    if (o.sessionEstablished !== true) {
        return {sessionEstablished: false};
    }
    const s = o.session;
    if (!s || typeof s !== "object") {
        return {sessionEstablished: false};
    }
    const displayName = (s as Record<string, unknown>).displayName;
    const attending = (s as Record<string, unknown>).attending;
    if (
        typeof displayName !== "string" ||
        !displayName.trim() ||
        typeof attending !== "boolean"
    ) {
        return {sessionEstablished: false};
    }
    return {
        sessionEstablished: true,
        session: s as GuestSessionClientSnapshot,
    };
}

export type SubmitRsvpFetchOptions = {
    /** §4: apply session from the same response body as `Set-Cookie` (plan §3.3). */
    onGuestSessionFromResponse?: ApplyGuestSessionFromApiBody;
};

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

export class RsvpApiError extends Error {
    readonly errorCode: string;
    constructor(code: string, status: number) {
        super(`RSVP request failed: ${status}`);
        this.name = "RsvpApiError";
        this.errorCode = code;
    }
}

function isNotificationFailurePayload(
    data: unknown,
): data is { error: string; step: "admin" | "guest"; id: string } {
    if (!data || typeof data !== "object") return false;
    const o = data as Record<string, unknown>;
    return (
        o.error === "notification_failed" &&
        (o.step === "admin" || o.step === "guest") &&
        typeof o.id === "string"
    );
}

export async function submitRsvpFetch(
    body: Record<string, unknown>,
    options?: SubmitRsvpFetchOptions,
): Promise<void> {
    const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(body),
        credentials: "same-origin",
    });

    let data: unknown;
    try {
        data = await res.json();
    } catch {
        data = null;
    }

    if (!res.ok) {
        if (res.status === 502 && isNotificationFailurePayload(data)) {
            options?.onGuestSessionFromResponse?.(extractGuestSessionFromRsvpJson(data));
            throw new RsvpNotificationError(data.step, data.id);
        }
        const errorCode =
            data && typeof data === "object" && "error" in data && typeof (data as Record<string, unknown>).error === "string"
                ? (data as Record<string, unknown>).error as string
                : undefined;
        if (res.status === 429) throw new RsvpApiError(errorCode ?? "too_many_requests", res.status);
        if (res.status === 413) throw new RsvpApiError(errorCode ?? "payload_too_large", res.status);
        if (res.status === 403) throw new RsvpApiError(errorCode ?? "feature_disabled", res.status);
        throw new RsvpApiError(errorCode ?? "server_error", res.status);
    }

    options?.onGuestSessionFromResponse?.(extractGuestSessionFromRsvpJson(data));
}
