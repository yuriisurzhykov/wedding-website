# widget: gallery-section

Home section `#gallery`:

- **Server:** `GallerySection` loads initial rows with `@features/gallery-list`.
- **Client:** `GalleryPhotosClient` — `PhotoUploader` (via `@features/gallery-upload`), then refetch list from **`GET /api/gallery/photos`** after successful uploads; thumbnail grid opens **`GalleryLightbox`** (native `<dialog>`, prev/next, Escape, click on dimmed backdrop to close).
