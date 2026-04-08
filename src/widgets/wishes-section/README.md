# Widget: wishes-section

Section `#wishes` (home preview and `/wishes` full page).

## Public API

- **`WishesSection`**: `presentation?: 'preview' | 'full'` (default `'preview'`). Limits map from `presentation` via `config.ts` (not re-exported).
- **`className`**: root `Section`.
- **`contentClassName`**: inner content column.
- **`options.slots`**: `feed`, `loadMore`, `empty` (feed client), and `form` (wish form root).

Types: `WishesPresentation`, `WishesSectionOptions`.

## Layout

| Piece | Role |
| --- | --- |
| `WishesSection` | Server: `listWishes` first page, header, wires feed + form order. |
| `WishesFeedClient` | Client: `form` prop (React node) + feed; if there are no wishes, renders **empty message first**, then the form; if there are wishes, **form first**, then feed + load more. |
| `WishesFeed` | Card list. |
| `WishesLoadMore` | “Load more” (`full` only). |
| `WishesFeedEmpty` | Empty state. |
| `WishesSectionForm` | `POST /api/wishes` (`@features/wish-submit`). Optional photo via **`PhotoFileInput`** (`@shared/ui`); copy for limits/toasts comes from next-intl **`upload`** plus **`wishes`** for the rest of the form. |
| `lib/fetch-wishes-page.ts` | `GET /api/wishes` paging helper (client-only). |

## Optional photo

`lib/upload-wish-attachment.ts` uses the same presign / R2 / confirm path as the gallery (`@features/gallery-upload`). Size/type rules match `@entities/photo` and `@shared/lib/validate-gallery-photo-file`. On presign failure (e.g. size), the form surfaces errors and may toast using `upload` strings.

## Errors & edge cases

- Wish `POST` validation errors: `@features/wish-submit` (see feature README).
- Photo upload failures: see `@shared/ui` `PhotoFileInput` and `src/shared/lib/README.md` (Gallery / photo uploads).
