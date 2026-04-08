# `shared/lib`

Domain-agnostic helpers used across the app (FSD **shared** layer).

## Public API (`index.ts`)

| Export                                                                             | Module     | Role                                        |
|------------------------------------------------------------------------------------|------------|---------------------------------------------|
| `cn`                                                                               | `cn.ts`    | Tailwind + `clsx` merge                     |
| `formatPhoneAsYouType`, `isUsPhoneValid`, `normalizeUsPhoneToE164`, `toDialString` | `phone.ts` | US (NANP) phone parsing/formatting for RSVP |

## Gallery / photo uploads (client)

Aligned with `@entities/photo` limits and `@features/gallery-upload` server Zod schemas. UI entry point is **`@shared/ui` `PhotoFileInput`** (single `<input type="file">` for this app).

| Export | Module | Role |
|--------|----------|------|
| `resolveGalleryImageContentType` | `gallery-image-content-type.ts` | Infer MIME when `File.type` is empty (e.g. HEIC). |
| `validateGalleryPhotoFile`, `partitionGalleryPhotoFiles`, `isGalleryUploadOversizeMessage` | `validate-gallery-photo-file.ts` | Client checks before presign/multipart; map API “file too large” errors. |
| `useGalleryAcceptedBatch` | `use-gallery-accepted-batch.ts` | Hook: partition + toast for batch picker / drag-drop. |
| `formatUploadApiErrorResponse` | `format-upload-api-error.ts` | Parse JSON body from failed `fetch` to `POST /api/upload/*`. |
| `postMultipartGalleryPhoto` | `gallery-client-upload.ts` | `POST /api/upload/server` (multipart) when server upload mode is on. |

## Wedding calendar

Ceremony instants, schedule model, and locale formatters live in **`wedding-calendar/`** (see its README). Import the
public surface from `@shared/lib/wedding-calendar`, not from `config/` or `internal/` inside that folder.

## Imports

Prefer `@shared/lib` or `@shared/lib/wedding-calendar` over legacy `@/lib/utils`, `@/lib/phone`,
`@/lib/wedding-calendar` (those paths re-export here during migration).
