# Widget: admin-settings

Client forms for editing site-wide configuration via `PATCH /api/admin/site-settings`: **feature visibility** (hidden / preview / enabled) and the **day-of schedule** are separate screens and partial saves.

## Purpose

- **Features** — `AdminFeaturesForm` on `app/[locale]/admin/(dashboard)/features/page.tsx`.
- **Schedule** — `AdminScheduleForm` on `app/[locale]/admin/(dashboard)/schedule/page.tsx`.
- Legacy path `/admin/settings` redirects to `/admin/features`.

Server loads the current snapshot with `getSiteSettings()` and passes `initialSettings`.

## Approach

- **Auth:** sign in at `/admin/login`. Saves use `patchAdminSiteSettings()` (`fetch` with `credentials: 'include'`). The API still accepts legacy `ADMIN_SECRET` via headers for scripts.
- **Partial PATCH:** features form sends `{ capabilities }`; schedule form sends `{ schedule_program }`. The feature merges with the stored row.
- **Schedule text:** `titleKey` / `descKey` follow {@link SCHEDULE_I18N_CATALOG}; admins pick a preset per row.
- After a successful save, `router.refresh()` reloads server props; each form re-syncs when `initialSettings.updated_at` changes.

## Public API

| Export | Role |
|--------|------|
| `AdminFeaturesForm` | Props: `initialSettings: SiteSettings`. |
| `AdminScheduleForm` | Props: `initialSettings: SiteSettings`. |
| `patchAdminSiteSettings` | Client-side `PATCH` helper (shared error shape). |

## Usage

```tsx
const settings = await getSiteSettings();
return <AdminFeaturesForm initialSettings={settings} />;
```

## Errors and edge cases

- Schedule: duplicate row `id` values and empty `schedule_program` are blocked client-side before PATCH (server Zod also rejects).
