# `shared/ui`

Design-system primitives and client islands (FSD **shared** layer). Import from `@shared/ui` or `@shared/ui/<Component>` as in `tsconfig` paths.

## Photo picking and gallery upload

- **`PhotoFileInput`** — the only `<input type="file">` used for wedding photo rules (max size and MIME from `@entities/photo`). Modes: default **single file** (`onFileChange`); **`multiple`** + `onBatchAccepted` for batch selection. Validation and rejection toasts use the next-intl namespace **`upload`** (`messages/*/json` root key `upload`). Do not add a second raw file input for the same rules; compose this component instead.
- **`PhotoUploader`** — gallery UX: uploader name, dropzone, hidden `PhotoFileInput` (`multiple`), file list, and upload adapters (`presignedPhotoUploadAdapter`, `serverPhotoUploadAdapter`, etc.). Drag-and-drop reuses **`useGalleryAcceptedBatch`** so the same limits apply as for the hidden picker.

See also `src/shared/lib/README.md` (Gallery / photo uploads) and **`docs/r2-cors.md`** for presigned browser→R2 uploads.

## Other exports

Barrel: `index.ts`. Includes layout (`Section`, `SectionHeader`), forms (`DynamicForm`, `Input`, …), `AppToaster`, `LanguageSwitcher`, etc.
