# Entity: site-settings

Public shape and validation for the single-row `site_settings` table: feature **capabilities** (booleans) and
**schedule_program** (timeline JSON). No HTTP or Supabase clients.

## Purpose

- Shared Zod schemas and TypeScript types for server features and (later) admin UI.
- **Capability keys** gate product areas (`rsvp`, `wishSubmit`, `galleryUpload`, etc.); see `SITE_CAPABILITY_KEYS`.
- **Schedule rows** mirror `DAY_PROGRAM_TIMELINE` in `day-program.ts`; `titleKey` / `descKey` are next-intl paths.

## Public API

From `index.ts`:

- Types: `SiteSettings`, `SiteCapabilities`, `SiteCapabilityKey`, `ScheduleProgramItem`, `SiteSettingsPatch`,
  `PublicSiteSettingsApiSuccess`
- Schemas: `siteCapabilitiesSchema`, `scheduleProgramItemSchema`, `siteSettingsSchema`, `siteSettingsPatchSchema`,
  `publicSiteSettingsApiSuccessSchema` (for `GET /api/site-settings/public`)
- Defaults: `DEFAULT_SITE_CAPABILITIES`, `DEFAULT_SCHEDULE_PROGRAM`
- Schedule admin catalog (aligned with `day-program.ts` / i18n): `SCHEDULE_I18N_CATALOG`, `SCHEDULE_PROGRAM_ICON_IDS`,
  `getCatalogEntryBySegmentId`
- Parsers: `parseCapabilitiesFromDb`, `parseScheduleProgramFromDb`, `normalizeSiteSettingsRow`, `getDefaultSiteSettings`

## Usage

```ts
import {normalizeSiteSettingsRow, siteSettingsPatchSchema} from '@entities/site-settings';
```

## Extending

1. Add a key to `SITE_CAPABILITY_KEYS` and to `siteCapabilitiesSchema` / `DEFAULT_SITE_CAPABILITIES`.
2. Seed / migration for the new JSON key if you need DB defaults (optional merge handles missing keys).
3. Enforce in the relevant `@features/*` use-case and conditionally render in `app/[locale]/page.tsx`.

## Errors and edge cases

- Invalid or partial JSON from the DB is merged with code defaults so reads stay forward compatible.
- Empty `schedule_program` array falls back to `DEFAULT_SCHEDULE_PROGRAM`.
