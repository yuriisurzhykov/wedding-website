# entity: photo

Types and mappers for the `photos` table and gallery UI.

## Constants (single source)

- **`GALLERY_ALLOWED_CONTENT_TYPES`**, **`GALLERY_MAX_FILE_BYTES`** — must stay in sync with Zod in
  `@features/gallery-upload` (`validate-presign-payload`, multipart upload, confirm `sizeBytes`).
- **`GALLERY_MAX_SOURCE_FILE_BYTES`** — max raw file size in the picker/drop before browser-side resize (
  `@shared/lib/validate-gallery-photo-file`); **`GALLERY_MAX_IMAGE_EDGE_PX`** — long edge when downscaling in
  `@shared/lib/prepare-gallery-photo-for-upload`.
- **`GALLERY_PHOTO_FILE_ACCEPT`** — `accept` string for **`PhotoFileInput`** (`@shared/ui`): MIME types plus common
  extensions so the OS can filter by type (size is enforced in code, not by the native picker).

Client-side checks live in `@shared/lib/validate-gallery-photo-file`; uploads are normalized by
`@shared/lib/prepare-gallery-photo-for-upload` before presign/multipart.
