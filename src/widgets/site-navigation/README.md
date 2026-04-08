# Widget: `site-navigation`

Fixed header: couple title, anchor links from `@entities/site-nav`, `LanguageSwitcher`, and mobile drawer.

## Why this slice exists

Site chrome is **composition** (not a generic primitive), so it lives in `widgets` rather than `shared/ui`.

## Public API

| Export           | Role              |
|------------------|-------------------|
| `SiteNavigation` | Client component. |

## Extending

Add or change anchors in `@entities/site-nav` and matching `nav.*` message keys.
