# `shared/api/supabase`

Supabase clients for this Next.js app. **Never** expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.

## Public API

**Server-only** (service role + cookie server client) — import from **`server.ts`** so client bundles never pull
`server-only` modules:

| Export                       | Where to use                                                    |
|------------------------------|-----------------------------------------------------------------|
| `createServerClient`         | Route Handlers, Server Actions — **service role**, bypasses RLS |
| `createSupabaseCookieClient` | After `await cookies()` — `@supabase/ssr` with cookie storage   |

**`index.ts`** (safe for client + middleware):

| Export                           | Where to use                                                                               |
|----------------------------------|--------------------------------------------------------------------------------------------|
| `createBrowserClient`            | Client components — plain `supabase-js` with publishable key                               |
| `createSupabaseSsrBrowserClient` | Client — `@supabase/ssr` `createBrowserClient`                                             |
| `createSupabaseMiddlewareClient` | `middleware.ts` — returns `{ supabase, response }`; refresh session then return `response` |

## Environment variables

Aligned with `ARCHITECTURE.md` / `.env.example`:

- `NEXT_PUBLIC_SUPABASE_URL`
- Publishable/anon key: `NEXT_PUBLIC_SUPABASE_ANON_KEY` or publishable-key variants
- Server-only: `SUPABASE_URL` (optional fallback), `SUPABASE_SERVICE_ROLE_KEY`

## Errors

Constructors throw if required env vars are missing — fail fast at call time, not with a broken client.

## Legacy paths

`@/lib/supabase` still re-exports the same factories for old call sites. **Prefer** `@shared/api/supabase/server` and
`@shared/api/supabase` in new code (e.g. `app/api/ping/route.ts` uses the server entry directly).
