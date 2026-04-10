import "server-only";

import {canAttachWishPhotoAt, canUploadToGalleryAt,} from "@shared/lib/wedding-calendar";

export type UploadMediaPurpose = "gallery" | "wish";

export function assertUploadCelebrationPolicy(
    purpose: UploadMediaPurpose,
    attending: boolean,
    now: Date = new Date(),
): { ok: true } | { ok: false } {
    if (purpose === "gallery") {
        if (!canUploadToGalleryAt(now)) {
            return {ok: false};
        }
        return {ok: true};
    }
    if (!canAttachWishPhotoAt(now, {kind: "session", attending})) {
        return {ok: false};
    }
    return {ok: true};
}
