/**
 * Client-side: presign → PUT to R2 → confirm (same flow as gallery `PhotoUploader`).
 * Returns the object `key` for `POST /api/wishes` as `photoR2Key`.
 */
export async function uploadWishAttachment(
    file: File,
    uploaderName: string,
    onProgress: (p: number) => void,
): Promise<string> {
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
