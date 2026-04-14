import type {GuestSessionPublicErrorCode} from "./guest-session-error";

export type GuestAccountEmailPostValidationBody = {
    error: "validation";
    fieldErrors: Record<string, string[] | undefined>;
    formErrors: string[];
};

export type GuestAccountEmailPostGuestErrorBody = {
    error: { code: GuestSessionPublicErrorCode; retryAfterSec?: number };
};

function isRecord(v: unknown): v is Record<string, unknown> {
    return typeof v === "object" && v !== null;
}

/**
 * Parses `POST /api/guest/account/email` JSON on the client (no secrets).
 */
export function parseGuestAccountEmailPostJson(data: unknown):
    | { kind: "accepted" }
    | { kind: "validation"; body: GuestAccountEmailPostValidationBody }
    | { kind: "guest_error"; body: GuestAccountEmailPostGuestErrorBody }
    | { kind: "unknown" } {
    if (!isRecord(data)) {
        return {kind: "unknown"};
    }

    if (data.accepted === true) {
        return {kind: "accepted"};
    }

    if (data.error === "validation") {
        const fe = isRecord(data.fieldErrors)
            ? (data.fieldErrors as Record<string, string[] | undefined>)
            : {};
        const formErrors = Array.isArray(data.formErrors) ? (data.formErrors as string[]) : [];
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

    return {kind: "unknown"};
}
