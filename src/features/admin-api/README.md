# Feature: admin-api

## Purpose

Shared server utilities for the admin area: **rate limiting** (Postgres RPC `admin_check_rate_limit`), **password login** against the bcrypt hash in **`admin_site_credential`** (set with `npm run admin:set-password`, service_role only), **signed session cookies** (`ADMIN_SESSION_SECRET`), and **legacy `ADMIN_SECRET`** header auth for scripts. Used by `app/api/admin/**/route.ts` handlers and by `middleware.ts` for UI session checks.

## Approach

- Rate limits use a **fixed window** per opaque bucket key (`kind` + IP + optional hint), same pattern as guest-session restore limits.
- Session tokens are **HS256 JWTs** (`jose`), verified in Edge middleware and in API handlers.
- **Every** `/api/admin/*` handler must call `checkAdminRateLimit` with the appropriate `kind` (`login` for `POST /api/admin/login`, `api` for everything else) **before** business logic, then authorize with `isAdminApiAuthorized` unless the route is login-only.

## Public contract

| Export | Role |
|--------|------|
| `checkAdminRateLimit` | Records an attempt; returns `rate_limited` + `retryAfterSec` or database error. |
| `rateLimitToResponse` | Maps the result to **429** with `{ error, retry_after }` or **500**. |
| `isAdminApiAuthorized` | `true` if valid session cookie or legacy Bearer / `x-admin-token` `ADMIN_SECRET`. |
| `verifyAdminSessionJwt` | Edge-safe JWT check (middleware). |
| `performAdminLogin` / `performAdminLogout` | Used by login/logout routes only. |
| `adminLoginBodySchema` | Zod schema for `POST /api/admin/login`. |
| `getAdminRateLimitThresholds` | Reads env defaults for documentation and tests. |

## Usage

```typescript
import {
    checkAdminRateLimit,
    isAdminApiAuthorized,
    rateLimitToResponse,
} from "@features/admin-api";

export async function PATCH(request: Request) {
    const rl = await checkAdminRateLimit(request, "api");
    const blocked = rateLimitToResponse(rl);
    if (blocked) return blocked;
    if (!(await isAdminApiAuthorized(request))) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // ...
}
```

## Extension — new `/api/admin/*` route

1. Add a thin `route.ts`: parse body with Zod in this feature if shared, then `checkAdminRateLimit(request, "api")`, then `isAdminApiAuthorized`, then call the domain feature.
2. Add **en** + **ru** strings for any new user-facing errors.
3. Document **400 / 401 / 429 / 500 / 503** (login: **503** if `admin_site_credential` has no row) in the route’s feature README.

## Configuration

| Item | Role |
|------|------|
| `admin_site_credential` | Postgres table (singleton `id = 1`): `password_hash` (bcrypt). **No** env vars for the password. Apply migration, then run **`npm run admin:set-password -- <password>`** locally or in CI (needs `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`). |
| `ADMIN_SESSION_SECRET` | Secret for signing/verifying session JWT (required for cookie auth). |
| `ADMIN_SECRET` | Optional legacy Bearer token for API/scripts. |
| `ADMIN_RATE_LIMIT_LOGIN_MAX`, `ADMIN_RATE_LIMIT_LOGIN_WINDOW_SEC` | Stricter bucket for login. |
| `ADMIN_RATE_LIMIT_API_MAX`, `ADMIN_RATE_LIMIT_API_WINDOW_SEC` | Looser bucket for other admin API calls. |

## Errors & edge cases

- **429:** JSON `{ "error": "Too many requests", "retry_after": <seconds> }`.
- **401:** Invalid credentials on login; missing/invalid session or secret on protected API routes.
- **503 (login):** No row in `admin_site_credential` — run `npm run admin:set-password` after migrations.
- Rate limit RPC failure returns **500** from `rateLimitToResponse` (fail closed for abuse protection only after DB is healthy).
