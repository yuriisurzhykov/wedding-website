# Entity: site-settings

Public shape and validation for `site_settings` (version stamp, nullable **`public_contact_phone`** /
**`public_contact_email`**) and `site_feature_states` (per-feature `hidden` / `preview` / `enabled`). No HTTP or Supabase
clients here.

## Purpose

- Shared Zod schemas and TypeScript types for server features and admin UI.
- **Feature keys** (`SITE_FEATURE_KEYS`) match `site_feature_states.feature_key` and gate product areas (`rsvp`,
  `wishSubmit`, `galleryUpload`, etc.).

### Schedule (out of scope for this slice)

- **There is no `schedule_program` field** on `SiteSettings` or in `siteSettingsPatchSchema`. The legacy JSON column was
  removed from Postgres; wedding day timeline content lives only in **`schedule_section`** / **`schedule_items`** — see
  `@entities/wedding-schedule` and `@features/wedding-schedule`. Admin updates use **`PATCH /api/admin/schedule`**, not
  `PATCH /api/admin/site-settings`.

## Public API

From `index.ts`:

- Types: `FeatureState`, `SiteSettings`, `SiteFeatureStates`, `SiteCapabilities` (alias), `SiteFeatureKey`,
  `SiteCapabilityKey` (alias), `SiteSettingsPatch`, `PublicContact`, `PublicContactPatch`, `PublicContactDbRow`,
  `PublicSiteSettingsApiSuccess`
- Schemas: `featureStateSchema`, `siteFeatureStatesSchema`, `siteCapabilitiesSchema` (alias), `siteSettingsSchema`,
  `siteSettingsPatchSchema`, `publicContactSchema`, `publicContactPatchSchema`,
  `publicSiteSettingsApiSuccessSchema` (for `GET /api/site-settings/public`)
- Defaults: `DEFAULT_SITE_FEATURE_STATES`, `DEFAULT_SITE_CAPABILITIES` (alias)
- Parsers / merge: `parseFeatureStatesFromDb`, `parseFeatureStatesFromDbRows`, `parseFeatureStateFromDb`,
  `parseCapabilitiesFromDb` (alias), `normalizeSiteSettingsRow`, `getDefaultSiteSettings`, `getDefaultPublicContact`,
  `resolvePublicContactFromDb`, `mergePublicContactDbColumns`
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

### Public contact

- **`SiteSettings.public_contact`** is always resolved (non-empty `phone` and valid `email`) — defaults match
  **`getContactInfo()`** in `@entities/wedding-venue` when the DB columns are NULL or blank.
- **Patch:** optional `public_contact: { phone?, email? }`; trim on write; **empty string** clears that column to NULL and
  restores the code default for that field. Non-empty `email` must pass Zod email validation.
