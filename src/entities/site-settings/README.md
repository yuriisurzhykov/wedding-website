# Entity: site-settings

Public shape and validation for `site_settings` (schedule JSON) and `site_feature_states` (per-feature `hidden` /
`preview` / `enabled`). No HTTP or Supabase clients.

## Purpose

- Shared Zod schemas and TypeScript types for server features and admin UI.
- **Feature keys** (`SITE_FEATURE_KEYS`) match `site_feature_states.feature_key` and gate product areas (`rsvp`,
  `wishSubmit`, `galleryUpload`, etc.).
- **Schedule rows** mirror `DAY_PROGRAM_TIMELINE` in `day-program.ts`; `titleKey` / `descKey` are next-intl paths.

## Public API

From `index.ts`:

- Types: `FeatureState`, `SiteSettings`, `SiteFeatureStates`, `SiteCapabilities` (alias), `SiteFeatureKey`,
  `SiteCapabilityKey` (alias), `ScheduleProgramItem`, `SiteSettingsPatch`, `PublicSiteSettingsApiSuccess`
- Schemas: `featureStateSchema`, `siteFeatureStatesSchema`, `siteCapabilitiesSchema` (alias), `scheduleProgramItemSchema`,
  `siteSettingsSchema`, `siteSettingsPatchSchema`, `publicSiteSettingsApiSuccessSchema` (for `GET /api/site-settings/public`)
- Defaults: `DEFAULT_SITE_FEATURE_STATES`, `DEFAULT_SITE_CAPABILITIES` (alias), `DEFAULT_SCHEDULE_PROGRAM`
- Schedule admin catalog (aligned with `day-program.ts` / i18n): `SCHEDULE_I18N_CATALOG`, `SCHEDULE_PROGRAM_ICON_IDS`,
  `getCatalogEntryBySegmentId`
- Parsers: `parseFeatureStatesFromDb`, `parseFeatureStatesFromDbRows`, `parseFeatureStateFromDb`, `parseCapabilitiesFromDb`
  (alias), `parseScheduleProgramFromDb`, `normalizeSiteSettingsRow`, `getDefaultSiteSettings`
- Predicates: `isFeatureEnabled`, `isFeatureHidden`, `isFeaturePreview`, `isFeatureControlInteractive` (secondary
  controls: only `enabled` mounts interactive UI; `preview` is copy-only; `hidden` omits), `isFeatureNavVisible`,
  `resolveWishPhotoAttachForGuest`, `isWishPhotoAttachmentAllowedForGuest` (wish photo attach for not-attending guests
  when `wishSubmit` is `enabled`)

## Usage

```ts
import {normalizeSiteSettingsRow, siteSettingsPatchSchema, parseFeatureStatesFromDbRows} from '@entities/site-settings';
```

## Extending

1. Add a key to `SITE_FEATURE_KEYS` and to `siteFeatureStatesSchema` / `DEFAULT_SITE_FEATURE_STATES`.
2. Add a migration row seed for new installs and an `INSERT` for the new key when migrating existing DBs.
3. Enforce in the relevant `@features/*` use-case (`isFeatureEnabled` for writes) and in UI (nav uses
   `isFeatureNavVisible`).

## Errors and edge cases

- Invalid or partial `site_feature_states` data merges with code defaults so reads stay forward compatible.
- Legacy JSON booleans (`true`/`false`) in tests or old snapshots map to `enabled` / `hidden`.
- Empty `schedule_program` array falls back to `DEFAULT_SCHEDULE_PROGRAM`.
