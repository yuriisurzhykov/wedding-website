import {formatUploadApiErrorResponse} from "@shared/lib/format-upload-api-error";
import {postMultipartGalleryPhoto} from "@shared/lib/gallery-client-upload";
import {resolveGalleryImageContentType} from "@shared/lib/gallery-image-content-type";
import {GALLERY_USE_SERVER_MULTIPART_UPLOAD} from "@shared/lib/gallery-upload-mode";

/**
 * Returns the R2 object `key` for `POST /api/wishes` (`photoR2Key`).
 * Same mode as the gallery: presigned R2 by default; server multipart if
 * `NEXT_PUBLIC_GALLERY_SERVER_UPLOAD=true`.
 */
export async function uploadWishAttachment(
    file: File,
    uploaderName: string,
    onProgress: (p: number) => void,
): Promise<string> {
    const contentType = resolveGalleryImageContentType(file);
    if (!contentType) {
        const msg =
            "Unsupported or unknown image type. Use JPEG, PNG, WebP, or HEIC.";
        console.error("[uploadWishAttachment]", msg, {
            name: file.name,
            type: file.type,
            size: file.size,
        });
        throw new Error(msg);
    }

    if (!GALLERY_USE_SERVER_MULTIPART_UPLOAD) {
        const presignRes = await fetch("/api/upload/presign", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({contentType, size: file.size}),
        });
        if (!presignRes.ok) {
            const detail = await formatUploadApiErrorResponse(presignRes);
            console.error("[uploadWishAttachment] presign", presignRes.status, detail);
            throw new Error(`Presign failed: ${detail}`);
        }
        const {url, key} = (await presignRes.json()) as { url: string; key: string };
        onProgress(30);

        const uploadRes = await fetch(url, {
            method: "PUT",
            headers: {"Content-Type": contentType},
            body: file,
        });
        if (!uploadRes.ok) {
            const detail = await uploadRes.text().catch(() => uploadRes.statusText);
            console.error("[uploadWishAttachment] put R2", uploadRes.status, detail);
            throw new Error(
                `Upload to storage failed (${uploadRes.status}). ${detail.slice(0, 120)}`,
            );
        }
        onProgress(80);

        const confirmRes = await fetch("/api/upload/confirm", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                key,
                uploaderName,
                sizeBytes: file.size,
            }),
        });
        if (!confirmRes.ok) {
            const detail = await formatUploadApiErrorResponse(confirmRes);
            console.error("[uploadWishAttachment] confirm", confirmRes.status, detail);
            throw new Error(`Confirm failed: ${detail}`);
        }
        onProgress(100);

        return key;
    }

    const {key} = await postMultipartGalleryPhoto(file, uploaderName, onProgress);
    return key;
}

