"use client";

import {GALLERY_MAX_FILE_BYTES, GALLERY_MAX_IMAGE_EDGE_PX, GALLERY_MAX_SOURCE_FILE_BYTES,} from "@entities/photo";

import {resolveGalleryImageContentType} from "./gallery-image-content-type";

export type GalleryPhotoPrepareFailureReason =
    | "source_too_large"
    | "unreadable"
    | "output_too_large";

export class GalleryPhotoPrepareError extends Error {
    readonly kind: GalleryPhotoPrepareFailureReason;

    constructor(kind: GalleryPhotoPrepareFailureReason, message?: string) {
        super(message ?? kind);
        this.name = "GalleryPhotoPrepareError";
        this.kind = kind;
    }
}

function baseNameWithoutExt(fileName: string): string {
    const i = fileName.lastIndexOf(".");
    return i > 0 ? fileName.slice(0, i) : fileName;
}

async function decodeToDrawable(
    file: File,
): Promise<{ drawable: ImageBitmap | HTMLImageElement; revoke?: () => void }> {
    try {
        const bitmap = await createImageBitmap(file, {
            imageOrientation: "from-image",
        });
        return {drawable: bitmap};
    } catch {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.decoding = "async";
        await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error("decode"));
            img.src = url;
        });
        return {
            drawable: img,
            revoke: () => URL.revokeObjectURL(url),
        };
    }
}

function drawableSize(d: ImageBitmap | HTMLImageElement): { w: number; h: number } {
    return {w: d.width, h: d.height};
}

function canvasToJpegBlob(
    canvas: HTMLCanvasElement,
    quality: number,
): Promise<Blob | null> {
    return new Promise((resolve) => {
        canvas.toBlob((b) => resolve(b), "image/jpeg", quality);
    });
}

/**
 * Resizes and re-encodes a gallery/wish photo in the browser so the upload stays within
 * {@link GALLERY_MAX_FILE_BYTES} (aligned with server limits).
 *
 * If decoding fails but the file is already within the upload cap and has an allowed type,
 * the original file is returned (e.g. HEIC on browsers that cannot decode for canvas).
 */
export async function prepareGalleryPhotoFileForUpload(file: File): Promise<File> {
    if (!resolveGalleryImageContentType(file)) {
        throw new GalleryPhotoPrepareError("unreadable");
    }

    if (file.size > GALLERY_MAX_SOURCE_FILE_BYTES) {
        throw new GalleryPhotoPrepareError("source_too_large");
    }

    let revoke: (() => void) | undefined;
    let bitmap: ImageBitmap | undefined;

    try {
        const {drawable, revoke: r} = await decodeToDrawable(file);
        revoke = r;
        if (drawable instanceof ImageBitmap) {
            bitmap = drawable;
        }

        const {w: srcW, h: srcH} = drawableSize(drawable);
        if (srcW <= 0 || srcH <= 0) {
            throw new GalleryPhotoPrepareError("unreadable");
        }

        const maxEdge = Math.max(srcW, srcH);
        if (
            file.size <= GALLERY_MAX_FILE_BYTES &&
            maxEdge <= GALLERY_MAX_IMAGE_EDGE_PX
        ) {
            return file;
        }

        let targetW = srcW;
        let targetH = srcH;
        if (maxEdge > GALLERY_MAX_IMAGE_EDGE_PX) {
            const scale = GALLERY_MAX_IMAGE_EDGE_PX / maxEdge;
            targetW = Math.max(1, Math.round(srcW * scale));
            targetH = Math.max(1, Math.round(srcH * scale));
        }

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
            throw new GalleryPhotoPrepareError("unreadable");
        }

        let scaleDown = 1;
        const qualities = [0.92, 0.85, 0.78, 0.7, 0.62, 0.54, 0.46];

        for (let attempt = 0; attempt < 24; attempt += 1) {
            const w = Math.max(1, Math.round(targetW * scaleDown));
            const h = Math.max(1, Math.round(targetH * scaleDown));
            canvas.width = w;
            canvas.height = h;
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, w, h);
            ctx.drawImage(drawable, 0, 0, w, h);

            for (const q of qualities) {
                const blob = await canvasToJpegBlob(canvas, q);
                if (!blob) {
                    continue;
                }
                if (blob.size <= GALLERY_MAX_FILE_BYTES) {
                    const outName = `${baseNameWithoutExt(file.name) || "photo"}.jpg`;
                    return new File([blob], outName, {
                        type: "image/jpeg",
                        lastModified: Date.now(),
                    });
                }
            }

            scaleDown *= 0.88;
            if (w <= 32 || h <= 32) {
                break;
            }
        }

        throw new GalleryPhotoPrepareError("output_too_large");
    } catch (e) {
        if (e instanceof GalleryPhotoPrepareError) {
            throw e;
        }
        if (
            file.size <= GALLERY_MAX_FILE_BYTES &&
            resolveGalleryImageContentType(file)
        ) {
            return file;
        }
        throw new GalleryPhotoPrepareError("unreadable");
    } finally {
        revoke?.();
        bitmap?.close();
    }
}
