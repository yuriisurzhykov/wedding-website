# Entity: site-nav

Unified registry for the primary header menu: each entry is either an in-page section on the home screen or a dedicated route. One ordered list drives menu order, translation keys, and typed route pathnames.

## Public API

- `SITE_NAV_REGISTRY` — readonly ordered list of `{ kind, navKey, … }`.
  - `kind: 'section'` — `sectionId` matches the `Section` `id` on the home page (fragment `#sectionId`).
  - `kind: 'route'` — `pathname` is a top-level pathname under `app/[locale]/` (no locale prefix; same strings you pass to `next-intl` `Link`).
- `SiteNavRegistryEntry` — element type of that list.
- `SiteNavNavKey` — union of `navKey` values (labels live under `nav.<navKey>` in `messages/*.json`).
- `AppRoutePathname` — union of every `pathname` used by `kind: 'route'` entries (for typed links and route modules).
- `isRouteNavEntry` / `isSectionNavEntry` — type guards for consumers.

## When to use

- **Header / `SiteNavigation`:** iterate `SITE_NAV_REGISTRY`, translate `navKey`, resolve behavior from `kind`.
- **Typed navigation:** import `AppRoutePathname` (or `SiteNavRegistryEntry`) so new routes stay aligned with the menu and `app/[locale]` files.

## Checklist: new screen in a few minutes

1. Add **one** object to `SITE_NAV_REGISTRY` in `model/nav-registry.ts` (keep sort order product-correct).
2. Add the same **`navKey`** under `nav` in **`messages/ru.json`** and **`messages/en.json`**.
3. If `kind: 'route'`: add **`app/[locale]/<segment>/page.tsx`** (and layout/metadata if needed) with a `pathname` that **literally matches** the registry entry (see `AppRoutePathname`).
4. If `kind: 'section'`: ensure the home page includes a widget whose root `Section` uses **`id={sectionId}`** (same string as `sectionId` in the registry).
5. Rebuild / smoke-test: from home, from another locale, and from a subpage (section links must land on home with the correct hash).

## Home preview vs full gallery / wishes routes

Gallery and wishes use **`kind: 'route'`** (`/gallery`, `/wishes`). The home page may still expose sections with `id="gallery"` and `id="wishes"` for preview blocks and legacy URLs like `/#gallery`. Hash links only affect the home document; the menu points to full pages for those two items.

## Extending safely

- Prefer **one registry row** per menu item; do not duplicate path or fragment strings in the widget layer.
- Do **not** re-export numeric limits or unrelated constants from this package — only navigation structure and typed path literals derived from it.
