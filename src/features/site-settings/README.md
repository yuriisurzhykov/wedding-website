# Feature: site-settings

Server-only reads and writes for `site_settings`: publishable client for public SELECT, service role for upserts, Next
cache with tag invalidation on update.

## Purpose

- **`getSiteSettings` / `getSiteSettingsCached`:** load the normalized snapshot from Postgres (plus code defaults);
  cached reads also merge optional `NEXT_PUBLIC_SITE_FEATURES` for guest-facing enforcement (see Configuration).
- **`updateSiteSettings`:** merge a validated patch and persist (for admin API only).

## Approach

- Reads use `@shared/api/supabase/publishable-server-client` (anon key, RLS allows public SELECT on `site_settings`).
- Writes use `createServerClient` (service role) so INSERT/UPDATE bypass missing anon policies.
- **`getSiteSettingsCached`** wraps the DB read with `unstable_cache` (60s revalidate) and tag `site-settings`.
- **`updateSiteSettings`** calls `revalidateTag(SITE_SETTINGS_CACHE_TAG)` after a successful upsert.

## Public API

- `getSiteSettings(): Promise<SiteSettings>` — uncached read of **database** values (no `NEXT_PUBLIC_SITE_FEATURES`
  overlay). Use for admin UI and any code that must reflect what is stored in `site_settings`.
- `getSiteSettingsCached(): Promise<SiteSettings>` — use for guest-facing RSC, nav provider seed, public API, and
  use-cases that enforce capabilities; includes the env overlay (below).
- `updateSiteSettings(patch: unknown): Promise<UpdateSiteSettingsResult>` — validates with `siteSettingsPatchSchema`,
  merges with the current row, upserts, revalidates tag.
- `SITE_SETTINGS_CACHE_TAG` — import when another feature must invalidate after related changes (rare).
- **Client:** import from `@features/site-settings/client` — `SiteCapabilitiesProvider`, `useSiteCapabilities`, `FeatureGate`,
  and `SITE_SETTINGS_PUBLIC_API_PATH` (used by the provider to refetch). Do not import the server getters from client
  components.
- **HTTP:** `GET /api/site-settings/public` — JSON `{ ok: true, updated_at, capabilities }` for guest-tab refetch;
  validated with `publicSiteSettingsApiSuccessSchema` in `@entities/site-settings`.
- **Admin:** `PATCH /api/admin/site-settings` — JSON body as `siteSettingsPatchSchema`; protected by middleware (`ADMIN_SECRET`).
  Implemented in `app/api/admin/site-settings/route.ts` (thin handler calling `updateSiteSettings`).

## Usage

```ts
import {getSiteSettingsCached, updateSiteSettings, SITE_SETTINGS_CACHE_TAG} from '@features/site-settings';
import {SiteCapabilitiesProvider, FeatureGate} from '@features/site-settings/client';
```

Admin routes should pass the parsed JSON body into `updateSiteSettings`; map `{ok: false}` to HTTP 400 with the error
string.

## Errors and edge cases

- Read errors return `getDefaultSiteSettings()` so the site stays usable if Supabase is unreachable.
- `updateSiteSettings` returns `{ok: false, error}` for validation or Supabase errors — no throw.

## Configuration

- Cache: 60s revalidate + tag `site-settings`. Public route `GET /api/site-settings/public` uses `Cache-Control:
  private, no-cache, must-revalidate` so browsers revalidate while Next cache + tag own server freshness.

### `NEXT_PUBLIC_SITE_FEATURES` (optional, merged with DB)

The legacy env toggle is **not** a second source of truth: capabilities in `site_settings` remain authoritative in the
database. For **guest-facing** behavior only, `getSiteSettingsCached` (and thus the layout provider, home page, public
GET handler, and feature use-cases that call the cached reader) applies `NEXT_PUBLIC_SITE_FEATURES` **after** the DB
snapshot.

- **Merge order:** start from normalized DB capabilities (merged with code defaults per key), then for each **known**
  capability key (`SITE_CAPABILITY_KEYS` in `@entities/site-settings`) present in the env JSON with a **boolean** value,
  that value overrides the DB.
- **Invalid JSON:** env overrides are ignored; dev logs a console warning (`[site-settings] NEXT_PUBLIC_SITE_FEATURES…`).
- **Unknown keys** in the JSON are ignored.
- **Admin UI** uses `getSiteSettings()` so the form shows what will be persisted; effective guest toggles may still
  differ if env overrides are set on that deployment.

Example (force Our Story off on a preview deploy regardless of DB):

```bash
NEXT_PUBLIC_SITE_FEATURES={"ourStory":false}
```

You can include any capability key in the same object (e.g. `"rsvp":false`) for local or staging overrides.

**Deprecation note:** the old `@entities/site-features` slice was removed; do not add new call sites for env-only
feature flags — extend `SITE_CAPABILITY_KEYS` / admin capabilities instead, and use this env merge only when you
need a deploy-time override on top of DB.
