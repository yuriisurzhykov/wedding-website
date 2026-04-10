# Widget: `site-navigation`

Fixed header: couple title, menu from `SITE_NAV_REGISTRY` in `@entities/site-nav` (sections vs routes),
`LanguageSwitcher`, and mobile drawer.

## Why this slice exists

Site chrome is **composition** (not a generic primitive), so it lives in `widgets` rather than `shared/ui`.

## Public API

| Export           | Role              |
|------------------|-------------------|
| `SiteNavigation` | Client component. |

## Approach

- Schedule and RSVP links follow live `site_settings.capabilities` via `useSiteCapabilities()` from
  `@features/site-settings/client` (must render under `SiteCapabilitiesProvider` in the locale layout).
- `SiteNavRegistryEntryControl` maps each registry entry to either a `Link` (routes or home with hash from another page)
  or a `button` with `scrollIntoView` (sections while already on `/`).
- After client navigation to `/` with a fragment (e.g. from `/gallery` to `/#rsvp`), `SiteNavigation` runs a short
  `requestAnimationFrame` scroll so the target section is brought into view (App Router does not always scroll to `#` on
  its own).

## Extending

Add or change entries in `@entities/site-nav` (`SITE_NAV_REGISTRY`) and matching `nav.*` message keys in **both**
`messages/ru.json` and `messages/en.json`. Route items use `next-intl` `Link`; section items smooth-scroll on the home
page or link to `/#sectionId` from other pages.
