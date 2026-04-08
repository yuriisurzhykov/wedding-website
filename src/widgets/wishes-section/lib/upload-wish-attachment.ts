import {postMultipartGalleryPhoto} from "@shared/lib/gallery-client-upload";
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
    if (!GALLERY_USE_SERVER_MULTIPART_UPLOAD) {
        const presignRes = await fetch("/api/upload/presign", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({contentType: file.type, size: file.size}),
        });
        if (!presignRes.ok) {
            throw new Error("Presign failed");
        }
        const {url, key} = (await presignRes.json()) as {url: string; key: string};
        onProgress(30);

        const uploadRes = await fetch(url, {
            method: "PUT",
            headers: {"Content-Type": file.type},
            body: file,
        });
        if (!uploadRes.ok) {
            throw new Error("Upload failed");
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
            throw new Error("Confirm failed");
        }
        onProgress(100);

        return key;
    }

    const {key} = await postMultipartGalleryPhoto(file, uploaderName, onProgress);
    return key;
}

