# Widget: admin-dashboard

## Purpose

Composable admin home dashboard: KPI tiles, alerts, and supporting panels. Used from the locale-scoped admin dashboard page.

## Approach

Server components call `@features/admin-dashboard` (when present) and render presentational UI under `ui/`. Copy and numbers are passed in from parents so this slice stays free of hardcoded guest-facing strings.

## Public contract

From `index.ts`: `AdminDashboardSection` (async server component), `DashboardAllergyList`, `DashboardAlertsPanel`,
`DashboardStatCard`, and matching `*Props` types.

## Usage

```tsx
import {AdminDashboardSection} from '@widgets/admin-dashboard'

// In a server page:
<AdminDashboardSection />
```

```tsx
import {DashboardStatCard} from '@widgets/admin-dashboard'

<DashboardStatCard
  value={42}
  label={t('stats.rsvpTotal')}
  href="/admin/guests"
  badge={t('stats.onlineNow', {count: 3})}
  secondary={t('stats.rsvpBreakdown', {attending: 10, declined: 2})}
/>
```

```tsx
import {DashboardAllergyList} from '@widgets/admin-dashboard'

<DashboardAllergyList allergies={stats.allergies} />
```

```tsx
import {DashboardAlertsPanel} from '@widgets/admin-dashboard'

<DashboardAlertsPanel alerts={stats.alerts} />
```

## Errors & edge cases

`AdminDashboardSection` calls `fetchDashboardStats()`; on `{ ok: false }` it renders a translated error and the raw message for operators.

## Extension

Add sibling components and export them from `index.ts`; compose them inside `AdminDashboardSection` or the admin page.
