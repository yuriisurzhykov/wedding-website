# Coding standards — wedding website

Shared by human developers and AI assistants. Cursor loads the same expectations from `.cursor/rules/*.mdc`. The
long-form plan lives in **ARCHITECTURE.md** (see **§18 Rule for everything new**).

## Product and stack

- Next.js App Router, TypeScript (strict), Tailwind, next-intl, Supabase, Vercel — details and rationale in *
  *ARCHITECTURE.md**.

## Adding features

1. Config / data → `src/entities/<slice>/` (export via slice `index.ts`). Optional thin **re-export** from
   `lib/config/*.ts` for callers that still use `@/lib/config/...`; see **ARCHITECTURE.md §3.3**. Prefer `@entities/...`
   in new code.
2. Strings → `messages/ru.json` **and** `messages/en.json` together.
3. New section → `src/widgets/<name>/` (kebab-case folder; widget names in **ARCHITECTURE.md §3.2**), register in
   `app/[locale]/page.tsx` and `@entities/site-nav` (or `lib/config/nav.ts` re-export).
4. New primitive → `src/shared/ui/` only; theme tokens only (no inline hex colors). Do not add files under
   `components/` (deprecated; see **ARCHITECTURE.md §3.4**).

## Do not hardcode

- Styling: use design tokens / Tailwind classes, not inline colors for look-and-feel.
- Copy: use next-intl keys, not literal UI strings in components.
- Lists: config files, not ad-hoc arrays inside UI.

## FSD (`src/`)

- Aliases: `@shared`, `@entities`, `@features`, `@widgets` (see `tsconfig.json`).
- Imports flow down the stack: shared → entities → features → widgets → app.
- Expose slices through `index.ts`; document public API and errors in slice README + JSDoc.
- API route files stay thin: HTTP parsing and status mapping only.

## Module READMEs (entity / feature / widget slices)

Every slice under `src/entities`, `src/features`, or `src/widgets` that ships a public surface should include a *
*`README.md` next to the slice** (same folder as `index.ts`). The README is the human-facing contract; **`index.ts`
stays the only import path** for consumers outside the slice.

**Code style:** Prefer clear names, small files, and narrow functions so the code explains itself. **Do not** add
obvious line-by-line comments that restate what the code does; use comments only for non-obvious invariants, security
boundaries, or “why” that the code cannot express.

### What to cover

| Topic                   | Intent                                                                                                                                                                                                                              |
|-------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Purpose**             | What problem the slice solves and who calls it (pages, other slices).                                                                                                                                                               |
| **Approach**            | Where Server Components vs client islands live, where data comes from (DB, API, props), and any important boundaries.                                                                                                               |
| **Public contract**     | What callers may import from `index.ts` (functions, types, components). What is **not** exported (internal modules, implementation constants).                                                                                      |
| **Usage**               | Minimal example: import path and a short snippet (page or parent widget).                                                                                                                                                           |
| **Extension**           | How to add a field, mode, route, or API without breaking callers; checklist if it helps (e.g. i18n → Zod → mapper).                                                                                                                 |
| **Configuration**       | `className`, props, or `options` objects; defaults stay **inside** the slice unless product requires page-level overrides (see **ARCHITECTURE.md** and slice rules: do not re-export magic numbers from `index.ts` for casual use). |
| **Errors & edge cases** | Thrown vs `Result` shapes, HTTP status mapping for features behind routes, logging, empty states. Omit this subsection if truly N/A.                                                                                                |

### Title line

Use a consistent first line so slices are easy to scan in search:

- `# Entity: <slice-name>`
- `# Feature: <slice-name>`
- `# Widget: <slice-name>`

Use **sentence case** for the slice name after the colon; match the folder name (`kebab-case` folder → same token in the
title).

### Copy-paste template

Replace placeholders and delete sections that do not apply. Pick the title prefix (**Entity** / **Feature** / **Widget
**) to match the slice layer.

````markdown
# Feature: <slice-name>

Briefly: what this slice does and which layers may import it (e.g. widgets, `app/api`, other features).

## Purpose

- Problems solved and non-goals (what this slice deliberately does not own).

## Approach

- Server vs client: which parts are RSC, which are `'use client'`, and why.
- Data: Supabase, internal helpers, external APIs; caching or refetch notes if relevant.

## Public API

- From `index.ts`: list exports (components, functions, types) and one-line roles.
- **Not exported:** internal files, default limits, private helpers (callers must not depend on them).

## Usage

Minimal example (import path + usage):

```tsx
import { … } from '@features/<slice-name>';
// …
```

## Extending

- Steps to add a behavior (e.g. new option, new validation rule, new menu entry elsewhere).
- Cross-slice touch points if any (i18n keys, registry rows, new route).

## Configuration

- Props / `options` / `className`; where defaults live inside the slice.

## Errors and edge cases

- Failure modes, return types, or HTTP behavior for API-backed features.
````

For **widgets** that compose features, spell out **plug-in points** (home vs dedicated route) and dependencies (
`@features/...`, `GET /api/...`) in **Purpose** or **Approach**.

## Server and secrets

- Typed env accessors on the server; no exported secrets or scattered production defaults.
- Validate API bodies with Zod (and domain `refine` where needed).
- Non-blocking email: async send, log errors, document in the feature README.

## Diffs

Keep changes scoped to the task; avoid unrelated refactors.
