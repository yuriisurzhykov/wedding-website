# widget: gallery-section

Section `#gallery` (home preview and `/gallery` full page).

## Public API

- **`GallerySection`**: `presentation?: 'preview' | 'full'` (default `'preview'`). Limits are mapped inside the slice
  from `presentation`; they live only in `config.ts` and are **not** exported from `index.ts`.
- **`className`**: merged into root `Section`.
- **`contentClassName`**: merged into the inner content column (header + client island).
- **`options.slots`**: optional extra classes for regions inside `GalleryPhotosClient` — `uploader`, `grid`, `loadMore`,
  `empty`.

Types: `GalleryPresentation`, `GallerySectionOptions` (exported from the slice entry).

## Layout

| Piece                       | Role                                                              |
|-----------------------------|-------------------------------------------------------------------|
| `GallerySection`            | Server: `listGalleryPhotos` first page, wraps `Section` + header. |
| `GalleryPhotosClient`       | Client: upload, refetch, state, composes sub-UI.                  |
| `GalleryPhotoGrid`          | Thumbnail grid + open lightbox.                                   |
| `GalleryLightbox`           | Full-screen viewer; hosts zoom toggle, download, delete, nav.    |
| `GalleryZoomablePhoto`      | Photo surface: pinch / wheel / double-tap zoom, pan, swipe.      |
| `GalleryLoadMore`           | “Load more” row (`full` only).                                    |
| `GalleryEmptyState`         | Empty copy.                                                       |
| `lib/use-image-zoom.ts`     | Zoom/pan state machine for the lightbox surface.                 |
| `lib/fetch-gallery-page.ts` | `GET /api/gallery/photos` paging helper (client-only).            |
| `lib/download-gallery-photo-client.ts` | `GET /api/gallery/photos/[id]/download` → save via anchor. |

## Behavior

- On the **full** gallery route (`/gallery`), when the guest is **anonymous**, **`GuestSessionRestoreForm`** is shown
  above **`PhotoUploader`**. On the **home preview**, only a short hint with a link to **`#rsvp`** is shown (no inline
  restore form).
- After a successful upload, refetch **page 0** with the presentation’s page size.
- **`presentation: 'full'`**: “Load more” calls the same API with `offset = photos.length` until `hasMore` is false.
- **Lightbox zoom**: pinch (touch), mouse wheel, double-tap/click, or the toolbar toggle magnify the photo;
  panning is enabled while magnified and disables swipe navigation. Zoom resets on slide change and on close.
- **Download**: the toolbar button fetches the same-origin proxy `GET /api/gallery/photos/[id]/download`
  (sets `Content-Disposition: attachment`) and saves the blob; errors surface as a toast.

## Extend

- New layout hooks: add optional keys under `options.slots` and thread into the matching UI file (one file per concern).
