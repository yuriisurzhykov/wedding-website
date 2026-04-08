import {GALLERY_MAX_FILE_BYTES} from "@entities/photo";

import {resolveGalleryImageContentType} from "./gallery-image-content-type";

export type GalleryPhotoFileInvalidReason = "oversize" | "bad_type";

export type ValidateGalleryPhotoFileResult =
    | {ok: true}
    | {ok: false; reason: GalleryPhotoFileInvalidReason};

/**
 * Single place for client-side checks before presign / multipart (matches server Zod limits).
 */
export function validateGalleryPhotoFile(
    file: File,
): ValidateGalleryPhotoFileResult {
    if (file.size > GALLERY_MAX_FILE_BYTES) {
        return {ok: false, reason: "oversize"};
    }
    if (!resolveGalleryImageContentType(file)) {
        return {ok: false, reason: "bad_type"};
    }
    return {ok: true};
}

/** Batch pick / drop: keep valid files; report first rejection reason for one toast. */
export function partitionGalleryPhotoFiles(files: File[]): {
    accepted: File[];
    firstReject: GalleryPhotoFileInvalidReason | null;
} {
    const accepted: File[] = [];
    let firstReject: GalleryPhotoFileInvalidReason | null = null;
    for (const f of files) {
        const v = validateGalleryPhotoFile(f);
        if (v.ok) {
            accepted.push(f);
        } else if (!firstReject) {
            firstReject = v.reason;
        }
    }
    return {accepted, firstReject};
}

/** Presign / API error text when Zod rejects `size` (see `validate-presign-payload`). */
export function isGalleryUploadOversizeMessage(text: string): boolean {
    const lower = text.toLowerCase();
    return (
        lower.includes("file too large") ||
        (lower.includes("size") && lower.includes("too large"))
    );
}
