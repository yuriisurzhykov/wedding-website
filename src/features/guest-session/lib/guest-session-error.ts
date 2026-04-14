import type {GuestSessionValidateFailure} from "./types";

/**
 * Machine-readable error codes for guest flows (plan §5). Stable for `next-intl` mapping.
 * Upload / photo codes are owned by gallery flows but listed here for one catalog.
 */
export type GuestSessionPublicErrorCode =
    | "guest_session_expired"
    | "guest_session_missing"
    | "guest_session_invalid"
    /** Valid session cookie but no matching `guest_accounts` row (orphaned session). */
    | "guest_account_missing"
    | "restore_credentials_no_match"
    | "rate_limited"
    | "request_failed"
    | "server_error"
    | "upload_presign_failed"
    | "upload_r2_failed"
    | "upload_confirm_failed"
    | "upload_no_session"
    | "photo_delete_forbidden"
    | "magic_link_invalid"
    /** Legacy upload error code; prefer feature flags for new behavior. */
    | "celebration_not_live";

export type GuestSessionErrorPayload = {
    code: GuestSessionPublicErrorCode;
    retryAfterSec?: number;
};

export type GuestSessionErrorJsonBody = {
    error: GuestSessionErrorPayload;
};

/**
 * JSON body shape for API error responses (plan §5.1). Omits secrets.
 */
export function buildGuestSessionErrorJson(
    code: GuestSessionPublicErrorCode,
    extras?: { retryAfterSec?: number },
): GuestSessionErrorJsonBody {
    const payload: GuestSessionErrorPayload = {code};
    if (
        extras?.retryAfterSec !== undefined &&
        Number.isFinite(extras.retryAfterSec)
    ) {
        payload.retryAfterSec = Math.max(0, Math.floor(extras.retryAfterSec));
    }
    return {error: payload};
}

/**
 * Suggested HTTP status for a public error code (routes may adjust for edge cases).
 */
export function httpStatusForGuestSessionErrorCode(
    code: GuestSessionPublicErrorCode,
): number {
    switch (code) {
        case "guest_session_expired":
        case "guest_session_missing":
        case "guest_session_invalid":
        case "guest_account_missing":
        case "restore_credentials_no_match":
            return 401;
        case "photo_delete_forbidden":
        case "celebration_not_live":
            return 403;
        case "magic_link_invalid":
            return 400;
        case "rate_limited":
            return 429;
        case "request_failed":
            return 400;
        case "server_error":
            return 500;
        case "upload_presign_failed":
        case "upload_r2_failed":
        case "upload_confirm_failed":
        case "upload_no_session":
            return 400;
        default: {
            return code;
        }
    }
}

/**
 * Maps failed session validation to a public error code (for `GET /api/guest/session`, etc.).
 */
export function mapValidateGuestSessionFailureToCode(
    result: GuestSessionValidateFailure,
): GuestSessionPublicErrorCode {
    switch (result.reason) {
        case "missing":
            return "guest_session_missing";
        case "invalid":
            return "guest_session_invalid";
        case "expired":
            return "guest_session_expired";
        case "database":
            return "server_error";
        default: {
            return result.reason;
        }
    }
}
