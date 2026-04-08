# Coding standards — wedding website

Shared by human developers and AI assistants. Cursor loads the same expectations from `.cursor/rules/*.mdc`. The long-form plan lives in **ARCHITECTURE.md** (see **§18 Rule for everything new**).

## Product and stack

- Next.js App Router, TypeScript (strict), Tailwind, next-intl, Supabase, Vercel — details and rationale in **ARCHITECTURE.md**.

## Adding features

1. Config / data → `src/entities/<slice>/` (export via slice `index.ts`). Optional thin **re-export** from `lib/config/*.ts` for callers that still use `@/lib/config/...`; see **ARCHITECTURE.md §3.3**. Prefer `@entities/...` in new code.
2. Strings → `messages/ru.json` **and** `messages/en.json` together.
3. New section → `src/widgets/<name>/` (kebab-case folder; widget names in **ARCHITECTURE.md §3.2**), register in `app/[locale]/page.tsx` and `@entities/site-nav` (or `lib/config/nav.ts` re-export).
4. New primitive → `src/shared/ui/` only; theme tokens only (no inline hex colors). Do not add files under `components/` (deprecated; see **ARCHITECTURE.md §3.4**).

## Do not hardcode

- Styling: use design tokens / Tailwind classes, not inline colors for look-and-feel.
- Copy: use next-intl keys, not literal UI strings in components.
- Lists: config files, not ad-hoc arrays inside UI.

## FSD (`src/`)

- Aliases: `@shared`, `@entities`, `@features`, `@widgets` (see `tsconfig.json`).
- Imports flow down the stack: shared → entities → features → widgets → app.
- Expose slices through `index.ts`; document public API and errors in slice README + JSDoc.
- API route files stay thin: HTTP parsing and status mapping only.

## Server and secrets

- Typed env accessors on the server; no exported secrets or scattered production defaults.
- Validate API bodies with Zod (and domain `refine` where needed).
- Non-blocking email: async send, log errors, document in the feature README.

## Diffs

Keep changes scoped to the task; avoid unrelated refactors.
