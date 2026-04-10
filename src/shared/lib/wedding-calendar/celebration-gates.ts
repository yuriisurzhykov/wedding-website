import {isCelebrationLive} from "./internal/resolve-instants";

/**
 * Shared album: visible and uploadable only from {@link getCelebrationStartDate}.
 */
export function canBrowseGalleryAt(now: Date): boolean {
    return isCelebrationLive(now);
}

/**
 * Gallery uploads (same rule as browsing).
 */
export function canUploadToGalleryAt(now: Date): boolean {
    return isCelebrationLive(now);
}

/**
 * Wish photo attachment: guests who are not attending may attach before celebration;
 * anonymous (no session) and attending guests follow celebration timing on the server
 * (anonymous cannot upload in normal UI; policy still applies to crafted requests).
 */
export function canAttachWishPhotoAt(
    now: Date,
    ctx: { kind: "session"; attending: boolean } | { kind: "anonymous" },
): boolean {
    if (ctx.kind === "anonymous") {
        return isCelebrationLive(now);
    }
    if (!ctx.attending) {
        return true;
    }
    return isCelebrationLive(now);
}
