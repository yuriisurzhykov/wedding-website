import {formatUploadApiErrorResponse} from "@shared/lib/format-upload-api-error";
import {resolveGalleryImageContentType} from "@shared/lib/gallery-image-content-type";
import {prepareGalleryPhotoFileForUpload} from "@shared/lib/prepare-gallery-photo-for-upload";
import {UploadApiError} from "@shared/lib/upload-api-error";

/**
 * Returns the R2 object `key` for `POST /api/wishes` (`photoR2Key`).
 * Wish photos are **always** uploaded via presigned `PUT` + `/api/upload/confirm` (single file). The server multipart
 * proxy (`POST /api/upload/server`) is for the shared gallery only.
 */
export async function uploadWishAttachment(
    file: File,
    uploaderName: string,
    onProgress: (p: number) => void,
): Promise<string> {
    const uploadFile = await prepareGalleryPhotoFileForUpload(file);
    const contentType = resolveGalleryImageContentType(uploadFile);
    if (!contentType) {
        const msg =
            "Unsupported or unknown image type. Use JPEG, PNG, WebP, or HEIC.";
        console.error("[uploadWishAttachment]", msg, {
            name: uploadFile.name,
            type: uploadFile.type,
            size: uploadFile.size,
        });
        throw new Error(msg);
    }

    const presignRes = await fetch("/api/upload/presign", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            contentType,
            size: uploadFile.size,
            purpose: "wish",
        }),
    });
    if (!presignRes.ok) {
        const detail = await formatUploadApiErrorResponse(presignRes);
        console.error("[uploadWishAttachment] presign", presignRes.status, detail);
        throw new UploadApiError(`Presign failed: ${detail}`, presignRes.status);
    }
    const {url, key} = (await presignRes.json()) as { url: string; key: string };
    onProgress(30);

    const uploadRes = await fetch(url, {
        method: "PUT",
        headers: {"Content-Type": contentType},
        body: uploadFile,
    });
    if (!uploadRes.ok) {
        const detail = await uploadRes.text().catch(() => uploadRes.statusText);
        console.error("[uploadWishAttachment] put R2", uploadRes.status, detail);
        throw new UploadApiError(
            `Upload to storage failed (${uploadRes.status}). ${detail.slice(0, 120)}`,
            uploadRes.status,
        );
    }
    onProgress(80);

    const confirmRes = await fetch("/api/upload/confirm", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            key,
            uploaderName,
            sizeBytes: uploadFile.size,
            purpose: "wish",
        }),
    });
    if (!confirmRes.ok) {
        const detail = await formatUploadApiErrorResponse(confirmRes);
        console.error("[uploadWishAttachment] confirm", confirmRes.status, detail);
        throw new UploadApiError(`Confirm failed: ${detail}`, confirmRes.status);
    }
    onProgress(100);

    return key;
}
