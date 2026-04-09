import "server-only";

import type {
    GuestSessionPublicErrorCode,
    ValidateGuestSessionResult,
} from "@features/guest-session";
import {mapValidateGuestSessionFailureToCode} from "@features/guest-session";

/**
 * Maps failed guest session validation on upload routes to stable public codes (plan §5.2).
 */
export function uploadSessionErrorCode(
    reason: Extract<ValidateGuestSessionResult, {ok: false}>,
): GuestSessionPublicErrorCode {
    if (reason.reason === "database") {
        return mapValidateGuestSessionFailureToCode(reason);
    }
    return "upload_no_session";
}
