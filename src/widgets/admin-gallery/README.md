# Widget: admin-gallery

## Purpose

Admin screen for listing recent gallery photos and deleting selected rows (calls `DELETE /api/admin/photos`). Composes a server section with a client delete toolbar.

## Approach

- `AdminGallerySection` loads data with `listPhotosForAdmin` (service role, no guest feature gate).
- `AdminGalleryDeletePanel` handles selection, confirmation, `fetch` with credentials, toasts, and `router.refresh()`.

## Public contract

Export from `index.ts`: `AdminGallerySection` only.

## Usage

```tsx
import {AdminGallerySection} from '@widgets/admin-gallery'

export default function Page() {
  return <AdminGallerySection />
}
```

## Errors & edge cases

- Load failure shows an inline error string (i18n).
- Delete handles 401 / 429 using `admin.settings` error strings; other failures show a generic toast.

## Extension

Add pagination or “load more” by extending `listPhotosForAdmin` options and passing additional props into the panel.
