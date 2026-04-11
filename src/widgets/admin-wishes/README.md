# Widget: admin-wishes

## Purpose

Admin screen for listing recent guest wishes and deleting selected rows (calls `DELETE /api/admin/wishes`). Composes a server section with a client delete toolbar.

## Approach

- `AdminWishesSection` loads data with `listWishesForAdmin` (service role, no guest feature gate).
- `AdminWishesDeletePanel` handles selection, confirmation, `fetch` with credentials, toasts, and `router.refresh()`.

## Public contract

Export from `index.ts`: `AdminWishesSection` only.

## Usage

```tsx
import {AdminWishesSection} from '@widgets/admin-wishes'

export default function Page() {
  return <AdminWishesSection />
}
```

## Errors & edge cases

- Load failure shows an inline error string (i18n).
- Delete handles 401 / 429 using `admin.settings` error strings; other failures show a generic toast.

## Extension

Add pagination by extending `listWishesForAdmin` options and wiring UI controls in the panel.
