import {GALLERY_ALLOWED_CONTENT_TYPES, type GalleryAllowedContentType,} from "@entities/photo";

const EXT_TO_TYPE: Record<string, GalleryAllowedContentType> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    heic: "image/heic",
    heif: "image/heif",
};

/**
 * Browser `File.type` is often empty for HEIC/HEIF or wrong; infer from extension when needed.
 * Used for presigned PUT (must match the type sent to `/api/upload/presign`) and server multipart.
 */
export function resolveGalleryImageContentType(file: {
    name: string;
    type: string;
}): GalleryAllowedContentType | null {
    const raw = file.type.trim().toLowerCase();
    if (
        (GALLERY_ALLOWED_CONTENT_TYPES as readonly string[]).includes(
            raw,
        )
    ) {
        return raw as GalleryAllowedContentType;
    }

    const ext = file.name.includes(".")
        ? file.name.slice(file.name.lastIndexOf(".") + 1).toLowerCase()
        : "";
    return EXT_TO_TYPE[ext] ?? null;
}
