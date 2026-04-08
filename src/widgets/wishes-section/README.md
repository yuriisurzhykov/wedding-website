# widget: wishes-section

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
| `WishesSection` | Server: `listWishes` first page, header, wires feed + form. |
| `WishesFeedClient` | Client: pagination state, composes feed + load more. |
| `WishesFeed` | Card list. |
| `WishesLoadMore` | “Load more” (`full` only). |
| `WishesFeedEmpty` | Empty state. |
| `WishesSectionForm` | `POST /api/wishes` (`@features/wish-submit`). |
| `lib/fetch-wishes-page.ts` | `GET /api/wishes` paging helper (client-only). |

Optional image upload uses `upload-wish-attachment.ts` (presign / R2 / confirm, aligned with gallery upload).
