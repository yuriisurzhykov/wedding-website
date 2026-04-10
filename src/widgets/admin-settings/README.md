# Widget: admin-settings

Client form for editing `site_settings` (capabilities toggles and day-of schedule rows) via `PATCH /api/admin/site-settings`.

## Purpose

- Used by `app/[locale]/admin/settings/page.tsx` after the server loads the current snapshot with `getSiteSettingsCached()`.

## Approach

- **Auth:** the middleware allows `/[locale]/admin/*` when `ADMIN_SECRET` is sent as `Authorization: Bearer`, `x-admin-token`, or `?token=` in the URL. The form reads `token` from the query string (if present) into `sessionStorage` and sends `Authorization: Bearer` on save.
- **Schedule text:** `titleKey` / `descKey` are chosen from {@link SCHEDULE_I18N_CATALOG} (same copy as `day-program.ts` / `messages`); admins pick a preset per row; times, ids, icons, and venue fields are editable.
- After a successful save, `router.refresh()` reloads server props; the form re-syncs when `initialSettings.updated_at` changes.

## Public API

- `AdminSettingsForm` — props: `initialSettings: SiteSettings`.

## Usage

```tsx
const settings = await getSiteSettingsCached();
return <AdminSettingsForm initialSettings={settings} />;
```

## Errors and edge cases

- Duplicate schedule row `id` values are blocked client-side before PATCH.
- Empty `schedule_program` is blocked client-side (server Zod also rejects).
