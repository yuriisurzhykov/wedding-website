/**
 * Gallery / wish photo uploads: **default** is presigned `PUT` to R2 (needs bucket CORS).
 * Set `NEXT_PUBLIC_GALLERY_SERVER_UPLOAD=true` to send files through `POST /api/upload/server` instead.
 *
 * @see docs/r2-cors.md
 */
export const GALLERY_USE_SERVER_MULTIPART_UPLOAD =
    process.env.NEXT_PUBLIC_GALLERY_SERVER_UPLOAD === "true";
