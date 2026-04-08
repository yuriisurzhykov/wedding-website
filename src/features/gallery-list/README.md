# feature: gallery-list

Read-only fetch of `photos`. Used by `@widgets/gallery-section` (SSR) and **`GET /api/gallery/photos`** (JSON for the client grid after upload). Returns mapped `GalleryPhotoView[]` or error kinds for logging.
