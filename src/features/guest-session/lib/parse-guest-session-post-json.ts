import type {GuestSessionClientSnapshot} from "./client-snapshot";
import type {GuestSessionPublicErrorCode} from "./guest-session-error";

export type GuestSessionPostSuccessBody = {
    sessionEstablished: true;
    session: GuestSessionClientSnapshot;
};

export type GuestSessionPostGuestErrorBody = {
    error: { code: GuestSessionPublicErrorCode; retryAfterSec?: number };
};

export type GuestSessionPostValidationBody = {
    error: "validation";
    fieldErrors: Record<string, string[] | undefined>;
    formErrors: string[];
};

function isRecord(v: unknown): v is Record<string, unknown> {
    return typeof v === "object" && v !== null;
}

/**
 * Parses `POST /api/guest/session` JSON for client-side handling (no secrets).
 */
export function parseGuestSessionPostJson(data: unknown):
    | { kind: "success"; body: GuestSessionPostSuccessBody }
    | { kind: "guest_error"; body: GuestSessionPostGuestErrorBody }
    | { kind: "validation"; body: GuestSessionPostValidationBody }
    | { kind: "unknown" } {
    if (!isRecord(data)) {
        return {kind: "unknown"};
    }

    if (data.error === "validation") {
        const fe = isRecord(data.fieldErrors)
            ? (data.fieldErrors as Record<string, string[] | undefined>)
            : {};
        const formErrors = Array.isArray(data.formErrors)
            ? (data.formErrors as string[])
            : [];
        return {
            kind: "validation",
            body: {
                error: "validation",
                fieldErrors: fe,
                formErrors,
            },
        };
    }

    const err = data.error;
    if (isRecord(err) && typeof err.code === "string") {
        const retryRaw = err.retryAfterSec;
        const retryAfterSec =
            typeof retryRaw === "number" && Number.isFinite(retryRaw)
                ? Math.max(0, Math.floor(retryRaw))
                : undefined;
        return {
            kind: "guest_error",
            body: {
                error: {
                    code: err.code as GuestSessionPublicErrorCode,
                    ...(retryAfterSec !== undefined ? {retryAfterSec} : {}),
                },
            },
        };
    }

    if (
        data.sessionEstablished === true &&
        isRecord(data.session) &&
        typeof data.session.displayName === "string"
    ) {
        return {
            kind: "success",
            body: {
                sessionEstablished: true,
                session: data.session as GuestSessionClientSnapshot,
            },
        };
    }

    return {kind: "unknown"};
}
