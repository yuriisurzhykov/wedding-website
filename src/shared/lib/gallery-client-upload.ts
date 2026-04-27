"use client";

import {formatUploadApiErrorResponse} from "@shared/lib/format-upload-api-error";
import {UploadApiError} from "@shared/lib/upload-api-error";

/**
 * Uploads one photo via same-origin `POST /api/upload/server` (multipart).
 * Avoids browser→R2 CORS; file bytes go Next.js → R2.
 * Callers should pass bytes already normalized by `prepareGalleryPhotoFileForUpload` (see `@shared/lib/prepare-gallery-photo-for-upload`).
 */
export async function postMultipartGalleryPhoto(
    file: File,
    uploaderName: string,
    onProgress: (p: number) => void,
    options?: { purpose?: "gallery" | "wish" },
): Promise<{ key: string }> {
    onProgress(8);
    const fd = new FormData();
    fd.set("uploaderName", uploaderName.trim());
    fd.set("file", file);
    fd.set("purpose", options?.purpose ?? "gallery");

    const res = await fetch("/api/upload/server", {
        method: "POST",
        credentials: "same-origin",
        body: fd,
    });

    onProgress(85);

    if (!res.ok) {
        const detail = await formatUploadApiErrorResponse(res);
        console.error("[postMultipartGalleryPhoto]", res.status, detail);
        throw new UploadApiError(`Upload failed: ${detail}`, res.status);
    }

    const data = (await res.json()) as { ok?: boolean; key?: string };
    if (!data.ok || typeof data.key !== "string") {
        throw new Error("Upload failed");
    }

    onProgress(100);
    return {key: data.key};
}
