# Feature: site-settings

Server-only reads and writes for `site_settings` and `site_feature_states`: publishable client for public SELECT, service
role for upserts, Next cache with tag invalidation on update.

## Purpose

- **`getSiteSettings` / `getSiteSettingsCached`:** load the normalized snapshot from Postgres (`site_settings` +
  `site_feature_states`, plus code defaults). The snapshot **never** includes schedule rows or a `schedule_program` field;
  load the timeline in parallel with **`getResolvedGuestSchedule`** / **`getWeddingScheduleCached`** from
  `@features/wedding-schedule`.
- **`updateSiteSettings`:** merge a validated patch and persist feature states (for admin API only). **`siteSettingsPatchSchema`**
  allows `capabilities` and optional **`public_contact`** (phone/email). Schedule copy and icons are **not** merged here;
  use `@features/wedding-schedule` and `PATCH /api/admin/schedule`.

## Approach

- Reads use `@shared/api/supabase/publishable-server-client` (anon key, RLS allows public SELECT on `site_settings` and
  `site_feature_states`).
- Writes use `createServerClient` (service role) so INSERT/UPDATE bypass missing anon policies.
- **`getSiteSettingsCached`** wraps the DB read with `unstable_cache` (60s revalidate) and tag `site-settings`.
- **`updateSiteSettings`** bumps `site_settings.updated_at`, updates `public_contact_phone` / `public_contact_email` when
  the patch includes `public_contact`, upserts all `site_feature_states` rows, then calls
  `revalidateTag(SITE_SETTINGS_CACHE_TAG)`.

## Public API

- `getSiteSettings(): Promise<SiteSettings>` — uncached read of **database** values. Use for admin UI and any code that
  must reflect what is stored.
- `getSiteSettingsCached(): Promise<SiteSettings>` — use for guest-facing RSC, nav provider seed, public API, and
  use-cases that enforce feature states.
- `updateSiteSettings(patch: unknown): Promise<UpdateSiteSettingsResult>` — validates with `siteSettingsPatchSchema`,
  merges with the current snapshot, upserts, revalidates tag.
- `SITE_SETTINGS_CACHE_TAG` — import when another feature must invalidate after related changes (rare).
- **Client:** import from `@features/site-settings/client` — `SiteCapabilitiesProvider`, `useSiteCapabilities`,
  `FeatureGate` (optional `preview` slot for `preview` state), `GalleryHomeGate` (home gallery shell by
  `galleryBrowse`: hidden / preview / full children; upload/delete are inside the gallery widget), `SectionFeaturePreview`
  (title + subtitle + `previewNotice` from messages), and
  `SITE_SETTINGS_PUBLIC_API_PATH` (used by the provider to refetch). Do not import the server getters from client
  components.
- **HTTP:** `GET /api/site-settings/public` — JSON `{ ok: true, updated_at, capabilities, public_contact }` for
  guest-tab refetch; validated with `publicSiteSettingsApiSuccessSchema` in `@entities/site-settings`.
- **Admin:** `PATCH /api/admin/site-settings` — JSON body as `siteSettingsPatchSchema`; requires **rate limit pass** +
  **auth** (`isAdminApiAuthorized`: httpOnly session cookie from `POST /api/admin/login` or legacy `Authorization` /
  `x-admin-token` with `ADMIN_SECRET`). Implemented in `app/api/admin/site-settings/route.ts` (thin handler calling
  `updateSiteSettings`).

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

- **Feature states:** the only source of truth is Postgres (`site_feature_states`), read through `getSiteSettings` /
  `getSiteSettingsCached`. There is no build-time or runtime merge from public environment variables.
- **Public contact:** nullable `public_contact_phone` and `public_contact_email` on `site_settings`; empty or NULL uses
  the same defaults as `@entities/wedding-venue` (`resolvePublicContactFromDb`).
- Cache: 60s revalidate + tag `site-settings`. Public route `GET /api/site-settings/public` uses `Cache-Control: private,
  no-cache, must-revalidate` so browsers revalidate while Next cache + tag own server freshness.
