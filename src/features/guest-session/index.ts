/**
 * Guest session — **client-safe** exports: types, §4 snapshot builders, §5 error JSON helpers.
 * Server-only APIs (`createGuestSession`, cookie helpers, validation) live in `@features/guest-session/server`.
 */

export type {
    GuestSessionRow,
    GuestSessionValidateFailure,
    ValidateGuestSessionResult,
} from "./lib/types";

export type {GuestViewerSnapshot} from "@entities/guest-viewer";
export type {
    GuestSessionClientSnapshot,
} from "./lib/client-snapshot";
export {
    buildGuestSessionClientSnapshot,
    maskEmailForDisplay,
} from "./lib/client-snapshot";

export type {
    ApplyGuestSessionFromApiBody,
    GuestCompanionEmailRebindResult,
    GuestSessionRestoreResult,
    GuestSessionStatus,
} from "./ui/GuestSessionProvider";
export {GuestSessionProvider, useGuestSession} from "./ui/GuestSessionProvider";

export type {GuestSessionRestoreFormLayout} from "./ui/GuestSessionRestoreForm";
export {GuestSessionRestoreForm} from "./ui/GuestSessionRestoreForm";

export type {
    GuestSessionErrorJsonBody,
    GuestSessionErrorPayload,
    GuestSessionPublicErrorCode,
} from "./lib/guest-session-error";
export {
    buildGuestSessionErrorJson,
    httpStatusForGuestSessionErrorCode,
    mapValidateGuestSessionFailureToCode,
} from "./lib/guest-session-error";

export type {
    GuestAccountEmailPostGuestErrorBody,
    GuestAccountEmailPostValidationBody,
} from "./lib/parse-guest-account-email-post-json";
export {parseGuestAccountEmailPostJson} from "./lib/parse-guest-account-email-post-json";
