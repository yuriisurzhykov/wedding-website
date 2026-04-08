"use client";

import {formatUploadApiErrorResponse} from "@shared/lib/format-upload-api-error";

/**
 * Uploads one photo via same-origin `POST /api/upload/server` (multipart).
 * Avoids browser→R2 CORS; file bytes go Next.js → R2.
 */
export async function postMultipartGalleryPhoto(
    file: File,
    uploaderName: string,
    onProgress: (p: number) => void,
): Promise<{key: string}> {
    onProgress(8);
    const fd = new FormData();
    fd.set("uploaderName", uploaderName.trim());
    fd.set("file", file);

    const res = await fetch("/api/upload/server", {
        method: "POST",
        body: fd,
    });

    onProgress(85);

    if (!res.ok) {
        const detail = await formatUploadApiErrorResponse(res);
        console.error("[postMultipartGalleryPhoto]", res.status, detail);
        throw new Error(`Upload failed: ${detail}`);
    }

    const data = (await res.json()) as {ok?: boolean; key?: string};
    if (!data.ok || typeof data.key !== "string") {
        throw new Error("Upload failed");
    }

    onProgress(100);
    return {key: data.key};
}
