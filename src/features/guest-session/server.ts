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

export {buildGuestMagicLinkClaimAbsoluteUrl} from "./lib/build-guest-magic-link-claim-absolute-url";

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
    ParseGuestSessionRestoreBodyResult,
    RestoreGuestSessionByCredentialsResult,
} from "./lib/restore-guest-session-by-credentials";
export {
    parseGuestSessionRestoreBody,
    restoreGuestSessionByCredentials,
} from "./lib/restore-guest-session-by-credentials";

export type {ParseGuestCompanionRehomeBodyResult} from "./lib/parse-guest-companion-rehome-body";
export {parseGuestCompanionRehomeBody} from "./lib/parse-guest-companion-rehome-body";

export type {ExecuteGuestCompanionEmailRebindResult} from "./lib/request-guest-companion-email-rebind";
export {executeGuestCompanionEmailRebind} from "./lib/request-guest-companion-email-rebind";

export type {LoadGuestSessionSnapshotForGuestAccountResult} from "./lib/load-guest-session-snapshot-for-guest-account";
export {loadGuestSessionClientSnapshotForGuestAccount} from "./lib/load-guest-session-snapshot-for-guest-account";

export type {EnsurePrimaryGuestAccountResult} from "./lib/ensure-primary-guest-account";
export {getOrCreatePrimaryGuestAccountId} from "./lib/ensure-primary-guest-account";

export {getClientIpFromRequest} from "./lib/client-ip";

export {getViewerGuestAccountIdFromServerCookies} from "./lib/get-viewer-guest-account-from-server-cookies";

export type {CheckGuestSessionRestoreRateResult} from "./lib/restore-session-rate-limit";
export {
    buildGuestSessionRestoreRateBucketKey,
    checkGuestSessionRestoreRate,
} from "./lib/restore-session-rate-limit";
