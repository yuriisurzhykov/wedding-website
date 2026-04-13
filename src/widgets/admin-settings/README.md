# Widget: admin-settings

Client forms for site-wide configuration: **feature visibility** via `PATCH /api/admin/site-settings` and the **day-of
schedule** via `PATCH /api/admin/schedule`.

## Purpose

- **Features** — `AdminFeaturesForm` on `app/[locale]/admin/(dashboard)/features/page.tsx`.
- **Schedule** — `AdminScheduleForm` on `app/[locale]/admin/(dashboard)/schedule/page.tsx`.
- Legacy path `/admin/settings` redirects to `/admin/features`.

## Approach

- **Auth:** sign in at `/admin/login`. The schedule admin page loads with **`getWeddingSchedule()`** in RSC (same snapshot
  as **`GET /api/admin/schedule`** for scripts or client refetch). Saves use **`patchAdminSchedule()`** (`fetch` with
  `credentials: 'include'`); feature flags still use `patchAdminSiteSettings()`. The API still accepts legacy `ADMIN_SECRET` via headers
  for scripts.
- **Features PATCH:** `{ capabilities }` — merged server-side with `updateSiteSettings`.
- **Schedule GET:** `{ ok: true, section, items }` — same contract as `getWeddingSchedule()`.
- **Schedule PATCH:** replace-all `{ items }` (optional `section` copy) — validated and persisted by
  `replaceWeddingSchedule` (inline SVG sanitized before storage). SVG file uploads use **`POST /api/admin/schedule-icon/presign`**
  then `PUT` to R2; store returned `publicUrl` as `icon_url` on the item.
- **Schedule text:** editable Russian and English fields; presets copy literals from
  `WEDDING_SCHEDULE_ADMIN_PRESETS` (`@entities/wedding-schedule`).
- After a successful save, `router.refresh()` reloads server props; each form re-syncs when server `updated_at` changes.

## Public API

| Export | Role |
|--------|------|
| `AdminFeaturesForm` | Props: `initialSettings: SiteSettings`. |
| `AdminScheduleForm` | Props: `initialItems`, `sectionUpdatedAt` from `getWeddingSchedule()`. |
| `patchAdminSiteSettings` | Client `PATCH` helper for site settings. |
| `patchAdminSchedule` | Client `PATCH` helper for schedule replace-all. |

## Usage

```tsx
const settings = await getSiteSettings();
return <AdminFeaturesForm initialSettings={settings} />;
```

```tsx
const schedule = await getWeddingSchedule();
return (
  <AdminScheduleForm
    initialItems={schedule.items}
    sectionUpdatedAt={schedule.section?.updated_at ?? ''}
  />
);
```

## Errors and edge cases

- Schedule: duplicate row `id` values and empty item lists are blocked client-side before PATCH (server Zod also rejects).
- Schedule: at most one row may have `emphasis: true`; the form uses a single radio group (none or one row) and rejects save if more than one flag is set.
