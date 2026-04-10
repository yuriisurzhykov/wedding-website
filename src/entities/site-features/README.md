# `site-features`

Central **on/off switches** for site areas that may be disabled per deploy (e.g. hide Our Story without deleting code).

## Public API

- `isSiteFeatureEnabled(id)` — boolean; safe on server and client (reads `NEXT_PUBLIC_*` only).
- `getSiteFeaturesSnapshot()` — read-only map of all flags.
- `filterSiteNavRegistryForSiteFeatures(entries)` — removes nav items for hidden sections (e.g. `story` when `ourStory`
  is off).

## Configuration

| Source                                              | Role                                                                                                                                                    |
|-----------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------|
| `DEFAULT_SITE_FEATURES` in `model/site-features.ts` | Code defaults (typically all enabled in repo).                                                                                                          |
| `NEXT_PUBLIC_SITE_FEATURES`                         | Optional JSON object with **known** keys only; overrides defaults. Unknown keys are ignored. Invalid JSON falls back to defaults (dev: `console.warn`). |

Example (disable Our Story):

```bash
NEXT_PUBLIC_SITE_FEATURES={"ourStory":false}
```

## Adding a new feature

1. Add a new id to `SiteFeatureId` and `DEFAULT_SITE_FEATURES` in `model/types.ts` / `model/site-features.ts`.
2. Wire the UI (e.g. conditional render on the home page, optional `filterSiteNavRegistryForSiteFeatures` branch by
   `navKey` or route).
3. Document the new JSON key in this README.

Keep flags **narrow**: do not expose secrets or PII; this slice is for visibility toggles only.
