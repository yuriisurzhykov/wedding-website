# Entity: site-nav

Anchor links for the main navigation: keys map to `next-intl` under the navigation namespace; `href` values are in-page fragment targets.

## Public API

- `NAV_ITEMS` — readonly list of `{ key, href }`.
- `SiteNavItem` — element type of that list.

## When to use

- **Shared UI / header:** build the menu from `NAV_ITEMS` and translate `key`.

## Extending

Append an item with a new `key` and `href` (usually `#section-id`), then add the same `key` to `messages/*.json` navigation strings and ensure the section exists on the page.
