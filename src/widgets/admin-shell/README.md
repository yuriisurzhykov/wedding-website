# Widget: admin-shell

## Purpose

Layout shell for authenticated admin pages: **sidebar navigation**, **logout**, and shared styling. The login page uses `AdminLoginForm` without this shell. Future admin screens (guests, gallery, …) render as `children` inside `AdminShell`.

## Approach

- Navigation links are defined in `model/admin-nav.ts` as locale-agnostic paths (`/admin/...`). `next-intl` `Link` applies the correct locale prefix.
- Logout calls `POST /api/admin/logout` with `credentials: 'include'`, then navigates to `/admin/login` (or `/ru/admin/login`).

## Public contract

| Export | Role |
|--------|------|
| `AdminShell` | Server component wrapping page content with nav + logout. |
| `AdminLoginForm` | Client form for `POST /api/admin/login`. |
| `AdminStubSection` | Placeholder copy for routes not yet implemented. |
| `ADMIN_NAV_ITEMS` | Source of truth for menu order and `href`s. |

## Usage

Wrap each authenticated admin `page.tsx` (except login) in `app/[locale]/admin/(dashboard)/layout.tsx` so all dashboard routes share the shell.

## Extension — add a new admin screen

1. Add a `ADMIN_NAV_ITEMS` entry in `model/admin-nav.ts` (`href`, `navKey`).
2. Add `admin.shell.nav.<navKey>` (and any page titles) to **both** `messages/en.json` and `messages/ru.json`.
3. Add `app/[locale]/admin/(dashboard)/<segment>/page.tsx` (or a nested route). The segment path must match the `href`.
4. Implement UI in a dedicated widget or feature; keep `app/api/admin/...` routes thin per project rules.

## Configuration

None beyond i18n keys.

## Errors & edge cases

- Logout failure leaves the user on the page; they can retry or clear cookies manually.
