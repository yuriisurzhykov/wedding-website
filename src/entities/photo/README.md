# entity: photo

Types and mappers for the `photos` table and gallery UI.

## Constants (single source)

- **`GALLERY_ALLOWED_CONTENT_TYPES`**, **`GALLERY_MAX_FILE_BYTES`** — must stay in sync with Zod in `@features/gallery-upload` (`validate-presign-payload`, multipart upload).
- **`GALLERY_PHOTO_FILE_ACCEPT`** — `accept` string for **`PhotoFileInput`** (`@shared/ui`): MIME types plus common extensions so the OS can filter by type (size is enforced in code, not by the native picker).

Client-side checks live in `@shared/lib/validate-gallery-photo-file` and must match these constants.
