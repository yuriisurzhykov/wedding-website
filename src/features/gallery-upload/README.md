# Feature: gallery-upload

**Two upload paths**

1. **Presigned (default)** — `presignGalleryUpload` / `confirmGalleryUpload` + `POST /api/upload/presign` and `confirm`.
   Browser `PUT`s directly to R2. The bucket **must** have CORS — copy `docs/r2-cors-dashboard.json` per *
   *`docs/r2-cors.md`**.
2. **Server multipart** — `uploadGalleryPhotoFromMultipart` + `POST /api/upload/server`. Use when R2 CORS is impossible
   or for Vercel body limits: set `NEXT_PUBLIC_GALLERY_SERVER_UPLOAD=true`.

**Client alignment**

- Allowed types, max **source** size (picker), and max **upload** size after optimization come from **`@entities/photo`
  **. Call **`prepareGalleryPhotoFileForUpload`** (`@shared/lib/prepare-gallery-photo-for-upload`) before presign or
  multipart so large photos are resized/compressed in the browser; the server still enforces **`GALLERY_MAX_FILE_BYTES`
  ** (Zod on presign `size`, multipart `file.size`, confirm `sizeBytes`).
- Run **`validateGalleryPhotoFile`** / **`partitionGalleryPhotoFiles`** (`@shared/lib/validate-gallery-photo-file`) when
  accepting files so users get toasts for oversize originals or bad types before optimization.
- Multipart resolves `Content-Type` with **`resolveGalleryImageContentType`** when `File.type` is empty (same idea as
  presign body on the client).

**Errors**

- **400** — validation (`fieldErrors` / `formErrors` from Zod, or multipart message).
- **403** — `{ error: 'feature_disabled' }` — gallery flow when `galleryUpload` is off; presign/multipart with `purpose: 'wish'` when `wishPhotoAttach` is off; photo delete when `galleryPhotoDelete` is off.
- **500** — missing R2 or Supabase env, R2 failure, or DB error.

Public entry: `@features/gallery-upload` only. HTTP mapping lives in `app/api/upload/*`.
