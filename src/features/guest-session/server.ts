import "server-only";

/**
 * Server-only guest session API: Supabase persistence, cookies, validation.
 * Import from `@features/guest-session/server` in Route Handlers and server actions.
 *
 * For types and error JSON shared with client code, use `@features/guest-session`.
 */

export type {GuestSessionRow, ValidateGuestSessionResult} from "./lib/types";
export type {CreateGuestSessionResult} from "./lib/create-session";
export {createGuestSession} from "./lib/create-session";

export type {CreateGuestMagicLinkTokenResult} from "./lib/create-magic-link-token";
export {createGuestMagicLinkToken} from "./lib/create-magic-link-token";

export type {ClaimMagicLinkResult} from "./lib/claim-magic-link";
export {claimMagicLink} from "./lib/claim-magic-link";

export type {GuestClaimLocale} from "./lib/handle-guest-claim-get";
export {
    handleGuestClaimGet,
    mapClaimFailureToGuestClaimErrorQuery,
    parseGuestClaimSearchParams,
} from "./lib/handle-guest-claim-get";

export {validateGuestSession, validateGuestSessionFromRequest} from "./lib/validate-session";

export type {GuestSessionRuntimeConfig} from "./lib/get-guest-session-config";
export {
    getGuestSessionRuntimeConfig,
    guestSessionExpiresAtFromNow,
} from "./lib/get-guest-session-config";

export type {GuestSessionCookieDescriptor} from "./lib/cookie";
export {
    extractGuestSessionTokenFromCookieHeader,
    extractGuestSessionTokenFromRequest,
    getClearGuestSessionCookieDescriptor,
    getGuestSessionCookieDescriptor,
} from "./lib/cookie";

export {hashSessionToken} from "./lib/token";

export type {
    LoadGuestSessionSnapshotResult,
    ParseGuestSessionRestoreBodyResult,
    RestoreGuestSessionByCredentialsResult,
} from "./lib/restore-guest-session-by-credentials";
export {
    loadGuestSessionClientSnapshotForRsvp,
    parseGuestSessionRestoreBody,
    restoreGuestSessionByCredentials,
} from "./lib/restore-guest-session-by-credentials";

export {getClientIpFromRequest} from "./lib/client-ip";

export {getViewerRsvpIdFromServerCookies} from "./lib/get-viewer-rsvp-from-server-cookies";

export type {CheckGuestSessionRestoreRateResult} from "./lib/restore-session-rate-limit";
export {
    buildGuestSessionRestoreRateBucketKey,
    checkGuestSessionRestoreRate,
} from "./lib/restore-session-rate-limit";
