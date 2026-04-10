/** Allowed `Content-Type` values for gallery / wish photo uploads (see `PhotoFileInput` / `PhotoUploader`). */
export const GALLERY_ALLOWED_CONTENT_TYPES = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
] as const;

export type GalleryAllowedContentType = (typeof GALLERY_ALLOWED_CONTENT_TYPES)[number];

/** Max size after client normalization — must match Zod in `@features/gallery-upload` (presign, multipart, confirm). */
export const GALLERY_MAX_FILE_BYTES = 5 * 1024 * 1024;

/**
 * Max original file size before browser-side resize/compress (picker / drop).
 * Larger files are rejected to avoid memory issues; smaller images are still optimized to fit {@link GALLERY_MAX_FILE_BYTES}.
 */
export const GALLERY_MAX_SOURCE_FILE_BYTES = 40 * 1024 * 1024;

/** Long edge cap (px) when downscaling before JPEG encode. */
export const GALLERY_MAX_IMAGE_EDGE_PX = 2560;

/** `accept` for `<input type="file">` — MIME + extensions (OS may filter by type only). */
export const GALLERY_PHOTO_FILE_ACCEPT =
    "image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif";
