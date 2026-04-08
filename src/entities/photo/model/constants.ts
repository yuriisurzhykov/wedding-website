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

export const GALLERY_MAX_FILE_BYTES = 5 * 1024 * 1024;

/** `accept` for `<input type="file">` — MIME + extensions (OS may filter by type only). */
export const GALLERY_PHOTO_FILE_ACCEPT =
    "image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif";
