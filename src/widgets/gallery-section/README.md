# widget: gallery-section

Section `#gallery` (home preview and `/gallery` full page).

## Public API

- **`GallerySection`**: `presentation?: 'preview' | 'full'` (default `'preview'`). Limits are mapped inside the slice from `presentation`; they live only in `config.ts` and are **not** exported from `index.ts`.
- **`className`**: merged into root `Section`.
- **`contentClassName`**: merged into the inner content column (header + client island).
- **`options.slots`**: optional extra classes for regions inside `GalleryPhotosClient` — `uploader`, `grid`, `loadMore`, `empty`.

Types: `GalleryPresentation`, `GallerySectionOptions` (exported from the slice entry).

## Layout

| Piece | Role |
| --- | --- |
| `GallerySection` | Server: `listGalleryPhotos` first page, wraps `Section` + header. |
| `GalleryPhotosClient` | Client: upload, refetch, state, composes sub-UI. |
| `GalleryPhotoGrid` | Thumbnail grid + open lightbox. |
| `GalleryLightbox` | Full-screen viewer. |
| `GalleryLoadMore` | “Load more” row (`full` only). |
| `GalleryEmptyState` | Empty copy. |
| `lib/fetch-gallery-page.ts` | `GET /api/gallery/photos` paging helper (client-only). |

## Behavior

- After a successful upload, refetch **page 0** with the presentation’s page size.
- **`presentation: 'full'`**: “Load more” calls the same API with `offset = photos.length` until `hasMore` is false.

## Extend

- New layout hooks: add optional keys under `options.slots` and thread into the matching UI file (one file per concern).
