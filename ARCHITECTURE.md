# Wedding Website — Master Technical Plan

> Maximum detail. Single source of truth.
>
> Website: https://yuriimariia.wedding

---

## Table of Contents

1. [Stack and rationale](#1-stack-and-rationale)
2. [Real limits and cost](#2-real-limits-and-cost)
3. [Project structure](#3-project-structure)
4. [Design System — theme and styling](#4-design-system--theme-and-styling)
5. [i18n — Russian and English](#5-i18n--russian-and-english)
6. [Config-driven architecture](#6-config-driven-architecture)
7. [Database](#7-database)
8. [Phase 0 — Environment setup](#phase-0--environment-setup)
9. [Phase 1 — Scaffolding and deploy](#phase-1--scaffolding-and-deploy)
10. [Phase 2 — Design System and UI primitives](#phase-2--design-system-and-ui-primitives)
11. [Phase 3 — Static sections](#phase-3--static-sections)
12. [Phase 4 — RSVP](#phase-4--rsvp)
13. [Phase 5 — Photo gallery](#phase-5--photo-gallery)
14. [Phase 6 — Wishes](#phase-6--wishes)
15. [Phase 7 — Donations](#phase-7--donations)
16. [Phase 8 — Admin panel](#phase-8--admin-panel)
17. [Phase 9 — Polish and deploy](#phase-9--polish-and-deploy)
18. [Rule for everything new](#18-rule-for-everything-new)
19. [Pre-wedding checklist](#19-pre-wedding-checklist)

---

## 1. Stack and rationale

| Layer          | Technology                    | Rationale                                                                                                                                    |
|----------------|-------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------|
| Framework      | **Next.js 15** (App Router)   | SSG for static content — no cold start. RSC — no client-side JS where it isn't needed. API Routes — single deploy without a separate backend |
| Hosting        | **Vercel** (Hobby)            | CDN out of the box, serverless functions, cron jobs, $0. On the wedding day it scales itself — you don't need to watch anything              |
| Database       | **Supabase** (Free)           | PostgreSQL, Row Level Security, real-time subscriptions for the gallery, built-in REST API. $0 within the free tier                          |
| Object Storage | **Cloudflare R2**             | No egress fee — critical with 1,000 photos. 10 GB free. Presigned URLs — files go directly to R2, bypassing the server                       |
| Email          | **Resend** (Free)             | 3,000 emails/month, React Email templates, best DX in the category. $0                                                                       |
| i18n           | **next-intl**                 | Best App Router support, typed translations, automatic locale detection                                                                      |
| Payments       | **Venmo / Cash App / PayPal** | P2P transfers with no fees. Deep links open the app in 1 tap on mobile. Zelle — copies the number to clipboard                               |
| Language       | **TypeScript**                | Strict typing — form config, i18n keys, API contracts                                                                                        |
| Styling        | **Tailwind CSS v4**           | Utility-first. Reads CSS variables — single place to change the theme                                                                        |

### Why not a VPS

The main argument is not complexity, but **risk on the wedding day**. You will be in a suit standing next to your bride.
If something goes down — nobody will fix it. Vercel + R2 + Supabase — each component has a 99.9% SLA and an on-call team
24/7. You don't need to think about it.

---

## 2. Real limits and cost

### Vercel Hobby

- 100 GB bandwidth/month — your usage ~2 GB
- Serverless Functions — 60 sec max duration
- 2 Cron Jobs — we use one for Supabase keep-alive
- Restriction: personal (non-commercial) projects only. A wedding website is clearly personal ✓
- **Cost: $0**

### Supabase Free

- 500 MB PostgreSQL — your usage < 5 MB
- 50,000 MAU — your usage ~30 people
- **Gotcha: the project goes to sleep after 7 days of inactivity**
- Fix: a Vercel Cron every 5 days pings the DB — the project never sleeps (details in Phase 1)
- **Cost: $0**

### Cloudflare R2

- 10 GB storage — your usage: 1,000 photos × 5 MB = 5 GB (double the margin)
- 1 million Class A operations (writes) — your usage ~1,000
- 10 million Class B operations (reads) — your usage ~50,000
- Egress: **$0 forever** — this is the main advantage of R2 over S3
- **Cost: $0**

### Resend Free

- 3,000 emails/month — your usage ~100–200
- 100 emails/day — more than enough for RSVP notifications
- 1 domain, 1 day of log retention
- **Cost: $0**

### Summary

| Service       | Limit (free)     | Usage   | Cost       |
|---------------|------------------|---------|------------|
| Vercel        | 100 GB bandwidth | ~2 GB   | **$0**     |
| Supabase      | 500 MB DB        | < 5 MB  | **$0**     |
| Cloudflare R2 | 10 GB storage    | ~5 GB   | **$0**     |
| Resend        | 3,000 emails/mo  | ~200    | **$0**     |
| Domain        | —                | ~$12/yr | **~$1/mo** |
| **TOTAL**     |                  |         | **~$1/mo** |

---

## 3. Project structure

The repo is moving to **Feature-Sliced Design (FSD)** for code under `src/`: layers, one-way imports, and a narrow
public API per slice (`index.ts`). Official guide for FSD with
Next.js: [feature-sliced.design — Next.js](https://feature-sliced.design/docs/guides/tech/with-nextjs). Import rules and
aliases are summarized in **`docs/CODING_STANDARDS.md`** (FSD section) and in **`.cursor/rules/wedding-fsd-layers.mdc`
**.

### 3.1 Target layout: App Router + `src/` (FSD)

```
wedding/
├── app/
│   ├── [locale]/                        # i18n — pages under locale
│   │   ├── layout.tsx                   # Root layout: fonts, metadata, providers
│   │   ├── page.tsx                     # Home: compose widgets (target: only @widgets/*)
│   │   └── admin/
│   │       ├── layout.tsx
│   │       └── page.tsx
│   ├── api/                             # Not localised — thin HTTP adapters
│   │   ├── rsvp/route.ts                # POST: RSVP (delegates to @features/rsvp-submit)
│   │   ├── upload/presign|confirm/...
│   │   ├── wishes/route.ts
│   │   ├── ping/route.ts
│   │   └── admin/rsvp|photos/...
│   └── globals.css                      # Theme tokens (@theme)
│
├── src/
│   ├── shared/                          # No wedding-specific domain: UI primitives, clients, pure utils
│   │   ├── api/                         # e.g. Supabase, Resend (server/browser boundaries documented)
│   │   ├── lib/                         # cn, phone, public URL, wedding-calendar, …
│   │   └── ui/                          # Design-system components (migrated from components/ui)
│   ├── entities/                        # Domain model, types, list config, form↔DB mapping — no HTTP
│   │   └── rsvp/                        # Example: RSVP field config and mappers (expand public API here)
│   ├── features/                        # Use cases: Zod, writes, side effects (e.g. rsvp-submit)
│   └── widgets/                         # Section composition: Section + copy + local client islands
│       └── rsvp-section/                # One folder per section; see widget naming below
│
├── components/                          # Deprecated: README only — all UI lives under src/ (see §3.4)
├── lib/                                 # Transitional re-exports + non-FSD helpers (see 3.4)
├── messages/                            # ru.json, en.json — all UI strings
├── content/                             # MDX long-form (welcome, story, …)
├── middleware.ts
├── i18n/request.ts
├── next.config.ts
├── vercel.json
└── .env.local                           # Secrets (never in git)
```

**Layers (short):** `shared` → `entities` → `features` → `widgets` → `app`. A slice exposes only what its **`index.ts`**
exports; do not import deep paths from another slice.

### 3.2 Widget naming (home page and header)

Slice folders under `src/widgets/` use **kebab-case**. The default export surface from `index.ts` uses **PascalCase**
component names (e.g. `RsvpSection`).

| Current legacy file(s)     | Widget slice folder |
|----------------------------|---------------------|
| `Hero.tsx` (+ `Countdown`) | `hero-section`      |
| `Welcome.tsx`              | `welcome-section`   |
| `Schedule.tsx`             | `schedule-section`  |
| `DressCode.tsx`            | `dresscode-section` |
| `OurStory.tsx`             | `our-story-section` |
| `Navigation.tsx`           | `site-navigation`   |

Optional alias for the same responsibility: `header-navigation` — pick **one** name per deployment; the table above is
the canonical choice unless the team standardizes on the alias.

### 3.3 `lib/config` vs `src/entities`

- **End state:** domain lists and types (schedule, dresscode, nav, payments, RSVP fields, …) live under *
  *`src/entities/<name>/`** (e.g. `model/` or `config/`), exported from that slice’s **`index.ts`**.
- **Transition:** to avoid a single huge import-rewrite PR, new or moved definitions may be implemented in *
  *`src/entities/...`** and **re-exported** from the existing **`lib/config/*.ts`** files. Callers can keep using
  `@/lib/config/...` until a dedicated pass switches imports to `@entities/...` and drops the shim.
- **RSVP:** extend **`@entities/rsvp`** for field config and types; keep **`lib/config/rsvp.ts`** as a thin re-export
  until migration completes.

### 3.4 Legacy and transitional paths

**`components/`** — empty except `components/README.md` (deprecated; do not add code here). Sections and primitives were
moved to `src/widgets/*` and `src/shared/ui/`.

```
wedding/
├── lib/
│   ├── config/                          # Thin re-exports → @entities/* (see 3.3)
│   ├── supabase.ts, utils.ts, constants.ts, …  # Shims → @shared/* / @entities/* where noted
│   └── wedding-calendar/                # Re-export or alias of @shared/lib/wedding-calendar (if present)
│
├── content/, messages/                  # MDX + i18n JSON — not FSD slices
└── (no utils/supabase/ — use src/shared/api/supabase)
```

Prefer **`@shared/*`**, **`@entities/*`**, **`@features/*`**, **`@widgets/*`** in new code; keep `@/lib/*` only where a
shim still exists.

Env block for local secrets:

```
.env.local
    SUPABASE_URL
    SUPABASE_SERVICE_ROLE_KEY            # Server only — never in the frontend
    SUPABASE_ANON_KEY                    # Safe for client
    R2_ACCOUNT_ID
    R2_ACCESS_KEY_ID
    R2_SECRET_ACCESS_KEY
    R2_BUCKET_NAME
    R2_PUBLIC_URL                        # Bucket CDN URL (custom domain)
    RESEND_API_KEY
    RESEND_WEBHOOK_PUBLIC_URL            # Public URL of POST /api/webhooks/resend/inbound (Resend webhook subscription)
    RESEND_WEBHOOK_SIGNING_SECRET        # Svix signing secret for email.received (fallback; DB row preferred after sync)
    RESEND_INBOUND_DOMAIN                # Domain verified in Resend for inbound MX (asserted when syncing webhook)
    ADMIN_EMAIL                          # Where to send RSVP notifications
    ADMIN_SECRET                         # Optional legacy Bearer token for /api/admin (scripts)
    ADMIN_SESSION_SECRET                 # Signs admin session JWT (httpOnly cookie); admin password lives in DB (admin_site_credential)
    ADMIN_RATE_LIMIT_LOGIN_MAX           # optional — login rate limit (see @features/admin-api README)
    ADMIN_RATE_LIMIT_LOGIN_WINDOW_SEC
    ADMIN_RATE_LIMIT_API_MAX
    ADMIN_RATE_LIMIT_API_WINDOW_SEC
    ADMIN_EMAIL_MAX_BROADCAST_RECIPIENTS   # optional — cap per broadcast request (see @features/admin-email-dispatch README)
    ADMIN_EMAIL_SEND_DELAY_MS              # optional — pause between Resend calls in a broadcast
```

---

## 4. Design System — theme and styling

### Principle

In Tailwind v4 there is no `tailwind.config.ts`. All configuration goes directly in CSS via the `@theme` directive.
Tokens defined in `@theme` automatically become both Tailwind utilities (`bg-primary`, `text-text-muted`, `shadow-card`,
etc.) **and** CSS variables at the same time.

**One file `globals.css` — the single source of truth for everything.**

### How it works in v4

```
@theme { --color-primary: #C9A69A; }
         ↓ automatically generates:
  CSS variable:      --color-primary (available in inline styles)
  Tailwind classes:  bg-primary, text-primary, border-primary,
                     ring-primary, fill-primary, stroke-primary...
```

No manual mappings — Tailwind v4 does this itself by naming convention (`--color-*`, `--font-*`, `--radius-*`,
`--shadow-*`, `--text-*`).

### `app/globals.css` — the only configuration file

```css
@import "tailwindcss";

/* ============================================================
   @theme — design tokens.
   Defined here → automatically become utilities.
   Change a value here → changes everywhere on the site.
   ============================================================ */
@theme {
    /* --------------------------------------------------
     COLOURS
     Convention: --color-* → bg-*, text-*, border-* ...
     -------------------------------------------------- */
    /* Accent */
    --color-primary: #C9A69A;   /* Dusty rose */
    --color-primary-light: #E8D5CF;   /* bg-primary-light, hover */
    --color-primary-dark: #A67C6D;   /* bg-primary-dark, active */
    /* Secondary */
    --color-secondary: #8B7355;
    --color-accent: #D4B896;   /* Champagne */
    /* Backgrounds */
    --color-bg-base: #FDFAF7;   /* bg-bg-base */
    --color-bg-section: #F5F0E8;   /* bg-bg-section */
    --color-bg-card: #FFFFFF;   /* bg-bg-card */
    /* Text */
    --color-text-primary: #2C2420;   /* text-text-primary */
    --color-text-secondary: #6B5C54;   /* text-text-secondary */
    --color-text-muted: #A09088;   /* text-text-muted */
    --color-text-on-primary: #FFFFFF;   /* text-text-on-primary */
    /* Border */
    --color-border: #E8DDD8;   /* border-border */
    --color-border-focus: #C9A69A;   /* border-border-focus */
    /* --------------------------------------------------
     FONTS
     Convention: --font-* → font-*
     Values are injected from next/font/google via
     CSS variables in layout.tsx (see Phase 2)
     -------------------------------------------------- */
    --font-display: 'Cormorant Garamond', Georgia, serif;  /* font-display */
    --font-header: 'Cormorant Garamond', Georgia, serif;  /* font-display */
    --font-body: 'Lato', system-ui, sans-serif;             /* font-body */
    --font-accent: 'Great Vibes', cursive;                  /* font-accent */
    /* --------------------------------------------------
     TEXT SIZES
     Convention: --text-* → text-*
     -------------------------------------------------- */
    --text-hero: clamp(2.5rem, 8vw, 6rem);    /* text-hero */
    --text-h1: clamp(1.75rem, 4vw, 3rem);     /* text-h1 */
    --text-h2: clamp(1.25rem, 2.5vw, 2rem);   /* text-h2 */
    --text-h3: clamp(1rem, 1.5vw, 1.5rem);    /* text-h3 */
    --text-small: 0.875rem;                    /* text-small */
    --text-xs: 0.75rem;                        /* text-xs */
    /* --------------------------------------------------
     BORDER RADIUS
     Convention: --radius-* → rounded-*
     -------------------------------------------------- */
    --radius-sm: 0.375rem;   /* rounded-sm */
    --radius-md: 0.75rem;    /* rounded-md */
    --radius-lg: 1.5rem;     /* rounded-lg */
    --radius-pill: 9999px;   /* rounded-pill */
    /* --------------------------------------------------
     SHADOWS
     Convention: --shadow-* → shadow-*
     -------------------------------------------------- */
    --shadow-sm: 0 1px 4px rgba(44, 36, 32, 0.06);    /* shadow-sm */
    --shadow-card: 0 4px 24px rgba(44, 36, 32, 0.08); /* shadow-card */
    --shadow-modal: 0 20px 60px rgba(44, 36, 32, 0.2);/* shadow-modal */
    --shadow-button: 0 2px 8px rgba(201, 166, 154, 0.4); /* shadow-button */
}

/* ============================================================
   Variables NOT in @theme — do not generate utilities,
   used only via var() in CSS or inline styles.
   ============================================================ */
:root {
    /* Gradients — no Tailwind convention, use directly */
    --gradient-hero: linear-gradient(135deg, #F5F0E8 0%, #EDD5CA 50%, #F5F0E8 100%);
    --gradient-section: linear-gradient(180deg, #FDFAF7 0%, #F5F0E8 100%);
    --gradient-overlay: linear-gradient(to bottom, transparent 0%, rgba(44, 36, 32, 0.6) 100%);
    --gradient-button: linear-gradient(135deg, #C9A69A 0%, #A67C6D 100%);

    /* Layout */
    --spacing-section: clamp(4rem, 10vw, 8rem);
    --max-width: 1200px;
    --content-width: 720px;

    /* Animations */
    --transition-fast: 150ms ease;
    --transition-normal: 300ms ease;
    --transition-slow: 600ms ease;
}

/* ============================================================
   Dark sections — override @theme variables.
   In v4, @theme variables are regular CSS variables,
   so they can be overridden in any selector.
   ============================================================ */
[data-theme="dark-section"] {
    --color-bg-base: #2C2420;
    --color-bg-section: #3D2E29;
    --color-bg-card: #4A3830;
    --color-text-primary: #F5F0E8;
    --color-text-secondary: #D4C4BC;
    --color-text-muted: #A09088;
    --color-border: rgba(245, 240, 232, 0.12);
}

/* ============================================================
   Base styles
   ============================================================ */
html {
    scroll-behavior: smooth;
}

body {
    background-color: var(--color-bg-base);
    color: var(--color-text-primary);
    font-family: var(--font-body);
    line-height: 1.7;
}

h1, h2, h3, h4 {
    font-family: var(--font-display);
    line-height: 1.2;
}
```

### No `tailwind.config.ts` — this is intentional

In v4 this file is not needed. Content scanning (which files to scan for classes) is configured automatically or via
`@source` in CSS:

```css
/* Add to globals.css only if explicit scanning is needed */
@source "../components/**/*.tsx";
@source "../app/**/*.tsx";
@source "../content/**/*.mdx";
```

In practice, Next.js + Tailwind v4 find files automatically without `@source`.

### How to use in components

```typescript
// Tokens from @theme — used as regular Tailwind classes
<div className = "bg-bg-card text-text-primary shadow-card rounded-lg" / >
<button className = "bg-primary text-text-on-primary rounded-pill shadow-button" / >
<p className = "text-text-muted text-small" / >

// Gradients and layout — via inline style or custom CSS
<section style = {
{
    background: 'var(--gradient-hero)'
}
}
/>
< div
style = {
{
    maxWidth: 'var(--max-width)'
}
}
/>
```

### How to change the theme

```css
/* Change accent from rose to blue — one line in @theme */
--color-primary: #7B9EC7

;

/* Change the hero gradient — one line in :root */
--gradient-hero:
linear-gradient

(
135
deg, #EEF2F7

0
%
,
#D4E0F0

100
%
)
;

/* Change heading font */
--font-display:

'Playfair Display'
,
Georgia, serif

;
/* + update next/font/google in layout.tsx */
```

---

## 5. i18n — Russian and English

### Library: `next-intl`

Best choice for Next.js 15 App Router. Supports Server Components, typed keys, automatic locale detection.

```bash
npm install next-intl
```

### Routing

```
/ or /ru/...   → Russian (default — no prefix)
/en/...        → English
```

### `next.config.ts`

```typescript
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

export default withNextIntl({
    // rest of next config
})
```

### `i18n/request.ts`

```typescript
import {getRequestConfig} from 'next-intl/server'
import {notFound} from 'next/navigation'

const locales = ['ru', 'en'] as const

export default getRequestConfig(async ({locale}) => {
    if (!locales.includes(locale as typeof locales[number])) notFound()

    return {
        messages: (await import(`../messages/${locale}.json`)).default,
    }
})
```

### `middleware.ts` — i18n + admin protection in one

```typescript
import createIntlMiddleware from 'next-intl/middleware'
import {NextRequest, NextResponse} from 'next/server'

const intlMiddleware = createIntlMiddleware({
    locales: ['ru', 'en'],
    defaultLocale: 'ru',
    localePrefix: 'as-needed',  // /ru → / (no prefix), /en → /en
})

export function middleware(req: NextRequest) {
    // 1. Admin protection — before i18n
    const isAdminApi = req.nextUrl.pathname.startsWith('/api/admin')
    const isAdminUi = req.nextUrl.pathname.match(/^\/(ru\/|en\/)?admin/)

    if (isAdminApi || isAdminUi) {
        const token = req.headers.get('x-admin-token')
            ?? req.nextUrl.searchParams.get('token')

        if (token !== process.env.ADMIN_SECRET) {
            if (isAdminApi) {
                return NextResponse.json({error: 'Unauthorized'}, {status: 401})
            }
            return NextResponse.redirect(new URL('/', req.url))
        }
    }

    // 2. i18n routing for everything else
    // (Current repo: admin UI checks session JWT in middleware; /api/admin auth + rate limits live in route handlers.)
    return intlMiddleware(req)
}

export const config = {
    // Exclude API routes, static files — pages only
    matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}
```

### `messages/ru.json` — full file

```json
{
  "meta": {
    "title": "Имя и Имя — Свадьба",
    "description": "Присоединяйтесь к нам в особенный день"
  },
  "nav": {
    "schedule": "Программа",
    "dresscode": "Дрес-код",
    "story": "Наша история",
    "rsvp": "RSVP",
    "gallery": "Галерея",
    "wishes": "Пожелания",
    "donate": "Подарок"
  },
  "hero": {
    "names": "Имя & Имя",
    "date": "12 июля 2025",
    "venue": "Название места, Город",
    "countdown": {
      "days": "дней",
      "hours": "часов",
      "minutes": "минут",
      "seconds": "секунд",
      "passed": "Этот день уже наступил 🎉"
    }
  },
  "welcome": {
    "title": "Дорогие гости"
  },
  "schedule": {
    "title": "Программа праздника",
    "subtitle": "Все детали дня",
    "items": {
      "gathering": {
        "title": "Сбор гостей",
        "desc": "Вход через главные ворота. Парковка — за зданием."
      },
      "ceremony": {
        "title": "Церемония",
        "desc": "Церковное венчание. Просим прийти за 10 минут."
      },
      "reception": {
        "title": "Торжественный приём",
        "desc": "Переезд в ресторан."
      },
      "dinner": {
        "title": "Ужин и праздник",
        "desc": "Живая музыка, танцы, вечер."
      }
    }
  },
  "dresscode": {
    "title": "Дрес-код",
    "subtitle": "Просим придерживаться нежной пастельной палитры",
    "allowed": "Рекомендуем",
    "notAllowed": "Нежелательно",
    "yourColor": "Этот цвет впишется в палитру",
    "notYourColor": "Лучше выбрать другой оттенок",
    "colors": {
      "ivory": "Слоновая кость",
      "champagne": "Шампань",
      "dustyrose": "Пыльная роза",
      "sage": "Шалфей",
      "ash": "Пепельный",
      "white": "Белый",
      "black": "Чёрный"
    }
  },
  "story": {
    "title": "Наша история"
  },
  "rsvp": {
    "title": "Подтвердите участие",
    "subtitle": "Просим ответить до 1 июня",
    "willAttend": "Буду на свадьбе 🎉",
    "wontAttend": "К сожалению, не смогу",
    "fields": {
      "name": {
        "label": "Ваше имя",
        "placeholder": "Иван Иванов",
        "required": true
      },
      "email": {
        "label": "Email",
        "placeholder": "ivan@example.com",
        "required": false
      },
      "phone": {
        "label": "Телефон",
        "placeholder": "+1 (xxx) xxx-xxxx",
        "required": false
      },
      "guestCount": {
        "label": "Количество гостей",
        "placeholder": "",
        "required": false
      },
      "dietary": {
        "label": "Пищевые ограничения / аллергии",
        "placeholder": "Вегетарианец...",
        "required": false
      },
      "message": {
        "label": "Сообщение",
        "placeholder": "Напишите что-нибудь...",
        "required": false
      }
    },
    "submit": "Подтвердить",
    "submitting": "Отправка...",
    "successAttend": "Спасибо! Ждём вас с нетерпением 🎉",
    "successDecline": "Жаль, что не сможете прийти. Спасибо за ответ 🤍",
    "error": "Что-то пошло не так. Напишите нам напрямую."
  },
  "gallery": {
    "title": "Галерея",
    "subtitle": "Поделитесь воспоминаниями",
    "upload": "Загрузить фото",
    "uploaderName": "Ваше имя",
    "dropzone": "Перетащите фото сюда или нажмите для выбора",
    "maxSize": "Максимум 5 МБ на файл",
    "uploading": "Загрузка...",
    "done": "Фото загружены! Спасибо 🎉",
    "allLoaded": "Все фото загружены ✓",
    "empty": "Фотографий пока нет. Будьте первым!"
  },
  "wishes": {
    "title": "Пожелания",
    "subtitle": "Оставьте нам тёплые слова",
    "name": "Ваше имя",
    "message": "Ваше пожелание",
    "addPhoto": "Прикрепить фото (необязательно)",
    "submit": "Отправить пожелание",
    "success": "Спасибо за тёплые слова! 🤍",
    "empty": "Пожеланий пока нет. Будьте первым!"
  },
  "donate": {
    "title": "Подарить молодожёнам",
    "subtitle": "Лучший подарок — ваше присутствие. Но если хотите поздравить материально — мы будем очень благодарны 🤍",
    "zelleCopied": "Номер скопирован! Откройте банковское приложение → Zelle",
    "noFees": "Все переводы без комиссий — деньги приходят напрямую"
  }
}
```

### `messages/en.json` — full file

```json
{
  "meta": {
    "title": "Name & Name — Wedding",
    "description": "Join us on our special day"
  },
  "nav": {
    "schedule": "Schedule",
    "dresscode": "Dress Code",
    "story": "Our Story",
    "rsvp": "RSVP",
    "gallery": "Gallery",
    "wishes": "Wishes",
    "donate": "Gift"
  },
  "hero": {
    "names": "Name & Name",
    "date": "July 12, 2025",
    "venue": "Venue Name, City",
    "countdown": {
      "days": "days",
      "hours": "hours",
      "minutes": "minutes",
      "seconds": "seconds",
      "passed": "The big day has arrived! 🎉"
    }
  },
  "welcome": {
    "title": "Dear Guests"
  },
  "schedule": {
    "title": "Day Schedule",
    "subtitle": "All the details",
    "items": {
      "gathering": {
        "title": "Guest Arrival",
        "desc": "Enter through the main gates. Parking is behind the building."
      },
      "ceremony": {
        "title": "Ceremony",
        "desc": "Church wedding ceremony. Please arrive 10 minutes early."
      },
      "reception": {
        "title": "Reception",
        "desc": "Transfer to the restaurant."
      },
      "dinner": {
        "title": "Dinner & Celebration",
        "desc": "Live music, dancing, festivities."
      }
    }
  },
  "dresscode": {
    "title": "Dress Code",
    "subtitle": "Please follow our soft pastel color palette",
    "allowed": "Recommended",
    "notAllowed": "Please avoid",
    "yourColor": "This color fits our palette",
    "notYourColor": "We'd prefer a different shade",
    "colors": {
      "ivory": "Ivory",
      "champagne": "Champagne",
      "dustyrose": "Dusty Rose",
      "sage": "Sage",
      "ash": "Ash",
      "white": "White",
      "black": "Black"
    }
  },
  "story": {
    "title": "Our Story"
  },
  "rsvp": {
    "title": "RSVP",
    "subtitle": "Please respond by June 1st",
    "willAttend": "I'll be there 🎉",
    "wontAttend": "Unfortunately I can't make it",
    "fields": {
      "name": {
        "label": "Your name",
        "placeholder": "John Smith",
        "required": true
      },
      "email": {
        "label": "Email",
        "placeholder": "john@example.com",
        "required": false
      },
      "phone": {
        "label": "Phone",
        "placeholder": "+1 (xxx) xxx-xxxx",
        "required": false
      },
      "guestCount": {
        "label": "Number of guests",
        "placeholder": "",
        "required": false
      },
      "dietary": {
        "label": "Dietary restrictions",
        "placeholder": "Vegetarian, gluten-free...",
        "required": false
      },
      "message": {
        "label": "Message",
        "placeholder": "Write something...",
        "required": false
      }
    },
    "submit": "Confirm",
    "submitting": "Sending...",
    "successAttend": "Thank you! We can't wait to see you 🎉",
    "successDecline": "Sorry you can't make it. Thank you for letting us know 🤍",
    "error": "Something went wrong. Please contact us directly."
  },
  "gallery": {
    "title": "Gallery",
    "subtitle": "Share your memories",
    "upload": "Upload photos",
    "uploaderName": "Your name",
    "dropzone": "Drop photos here or click to select",
    "maxSize": "Max 5 MB per file",
    "uploading": "Uploading...",
    "done": "Photos uploaded! Thank you 🎉",
    "allLoaded": "All photos loaded ✓",
    "empty": "No photos yet. Be the first!"
  },
  "wishes": {
    "title": "Wishes",
    "subtitle": "Leave us a warm message",
    "name": "Your name",
    "message": "Your wish",
    "addPhoto": "Attach a photo (optional)",
    "submit": "Send wish",
    "success": "Thank you for the kind words! 🤍",
    "empty": "No wishes yet. Be the first!"
  },
  "donate": {
    "title": "Gift the couple",
    "subtitle": "Your presence is the best gift. But if you'd like to contribute — we'd be very grateful 🤍",
    "zelleCopied": "Number copied! Open your banking app → Zelle",
    "noFees": "All transfers are fee-free — money goes directly to us"
  }
}
```

---

## 6. Config-driven architecture

### Principle

**Component = logic and markup. Data = config.**

Adding a field to RSVP = adding one object to an array + one string to both JSON files. The `DynamicForm` component
reads the config and renders everything itself. No edits to JSX.

### `lib/config/rsvp.ts`

```typescript
export type FieldType =
    | 'text' | 'email' | 'tel' | 'number'
    | 'textarea' | 'select' | 'checkbox'

export interface FormField {
    key: string           // Key in payload and in i18n ("fields.KEY.label")
    type: FieldType
    required?: boolean
    min?: number           // For number / textarea (minLength)
    max?: number           // For number / textarea (maxLength)
    options?: { value: string | number; labelKey: string }[]
    showWhen?: (values: FormValues) => boolean   // Conditional render
    transform?: (value: string) => unknown        // Transform before sending
}

export type FormValues = Record<string, unknown>

// =============================================
// THIS IS WHERE YOU ADD / REMOVE FORM FIELDS
// =============================================
export const RSVP_FIELDS: FormField[] = [
    {
        key: 'name',
        type: 'text',
        required: true,
    },
    {
        key: 'email',
        type: 'email',
    },
    {
        key: 'phone',
        type: 'tel',
    },
    {
        key: 'guestCount',
        type: 'select',
        showWhen: (v) => v.attending === true,
        options: [
            {value: 1, labelKey: '1'},
            {value: 2, labelKey: '2'},
            {value: 3, labelKey: '3'},
            {value: 4, labelKey: '4'},
        ],
        transform: (v) => Number(v),
    },
    {
        key: 'dietary',
        type: 'text',
        showWhen: (v) => v.attending === true,
    },
    {
        key: 'message',
        type: 'textarea',
        max: 1000,
    },
    // EXAMPLE: add a "Need shuttle?" field
    // {
    //   key:      'needsTransfer',
    //   type:     'checkbox',
    //   showWhen: (v) => v.attending === true,
    // },
]
```

### Day-of schedule (Postgres, not `lib/config`)

Guest-facing timeline lives in **`schedule_items`** (sort order, wall time, ru/en copy, location URLs, icon fields).
Section titles and optional emphasis badge copy live in **`schedule_section`** (singleton row). Admin saves go through
`PATCH /api/admin/schedule` (`replaceWeddingSchedule` in `@features/wedding-schedule`). Domain types and Zod contracts
are in `@entities/wedding-schedule`. `@shared/lib/wedding-calendar` still supplies **`resolveScheduleItems`** so mapped DB
rows gain wedding-day **`instant`** values for display.

### `lib/config/dresscode.ts`

```typescript
export interface PaletteColor {
    key: string     // Key in messages.dresscode.colors.KEY
    hex: string
    allowed: boolean
}

export const PALETTE: PaletteColor[] = [
    {key: 'ivory', hex: '#F5F0E8', allowed: true},
    {key: 'champagne', hex: '#F7E7CE', allowed: true},
    {key: 'dustyrose', hex: '#C9A69A', allowed: true},
    {key: 'sage', hex: '#9CAF88', allowed: true},
    {key: 'ash', hex: '#9E9E9E', allowed: true},
    {key: 'white', hex: '#FFFFFF', allowed: false},
    {key: 'black', hex: '#000000', allowed: false},
]
```

### `lib/config/nav.ts`

```typescript
export const NAV_ITEMS = [
    {key: 'schedule', href: '#schedule'},
    {key: 'dresscode', href: '#dresscode'},
    {key: 'story', href: '#story'},
    {key: 'rsvp', href: '#rsvp'},
    {key: 'gallery', href: '#gallery'},
    {key: 'wishes', href: '#wishes'},
    {key: 'donate', href: '#donate'},
] as const
```

### `lib/config/payments.ts`

```typescript
export type PaymentService = 'venmo' | 'cashapp' | 'paypal' | 'zelle'

export interface PaymentConfig {
    id: PaymentService
    label: string
    icon: string
    deepLink: string
    fallback: string
    color: string    // Tailwind class
}

// REPLACE with real credentials
const VENMO_USERNAME = 'YOUR_VENMO'
const CASHAPP_TAG = '$YOUR_CASHTAG'
const PAYPAL_ME = 'YOUR_PAYPAL'
const ZELLE_PHONE = '+1 (xxx) xxx-xxxx'

export const PAYMENT_SERVICES: PaymentConfig[] = [
    {
        id: 'venmo',
        label: 'Venmo',
        icon: '💜',
        deepLink: `venmo://paycharge?txn=pay&recipients=${VENMO_USERNAME}&note=Wedding%20Gift%20💍`,
        fallback: `https://venmo.com/${VENMO_USERNAME}`,
        color: 'bg-[#3D95CE]',
    },
    {
        id: 'cashapp',
        label: 'Cash App',
        icon: '💚',
        deepLink: `https://cash.app/${CASHAPP_TAG}`,   // Universal link
        fallback: `https://cash.app/${CASHAPP_TAG}`,
        color: 'bg-[#00D632]',
    },
    {
        id: 'paypal',
        label: 'PayPal',
        icon: '🔵',
        deepLink: `https://paypal.me/${PAYPAL_ME}`,
        fallback: `https://paypal.me/${PAYPAL_ME}`,
        color: 'bg-[#003087]',
    },
    {
        id: 'zelle',
        label: 'Zelle',
        icon: '🏦',
        deepLink: '',     // No public API — copy number to clipboard
        fallback: '',
        color: 'bg-[#6D1ED4]',
    },
]

export const ZELLE_PHONE_NUMBER = ZELLE_PHONE
```

### `lib/constants.ts`

```typescript
export const WEDDING_DATE = new Date('2025-07-12T15:00:00')

export const VENUE = {
    name: 'Venue Name',
    address: '123 Wedding Lane, City, State',
    mapsUrl: 'https://maps.google.com/?q=...',
    parkingNote: 'Parking behind the building, free of charge',
}

export const CONTACT = {
    email: 'us@ourwedding.com',
    phone: '+1 (xxx) xxx-xxxx',
}

export const RSVP_DEADLINE = new Date('2025-06-01')
```

---

## 7. Database

### Schema — run in Supabase SQL Editor

```sql
-- =============================================
-- Guest RSVPs
-- =============================================
CREATE TABLE rsvp
(
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT    NOT NULL,
    email       TEXT,
    phone       TEXT,
    attending   BOOLEAN NOT NULL,
    guest_count INT              DEFAULT 1,
    dietary     TEXT,
    message     TEXT,
    created_at  TIMESTAMPTZ      DEFAULT now()
);

-- =============================================
-- Photos
-- =============================================
CREATE TABLE photos
(
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    r2_key        TEXT NOT NULL UNIQUE, -- "photos/uuid.jpg"
    uploader_name TEXT,
    public_url    TEXT NOT NULL,
    size_bytes    INT,
    uploaded_at   TIMESTAMPTZ      DEFAULT now()
);

-- =============================================
-- Wishes
-- =============================================
CREATE TABLE wishes
(
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_name  TEXT NOT NULL,
    message      TEXT NOT NULL,
    photo_r2_key TEXT,
    photo_url    TEXT,
    created_at   TIMESTAMPTZ      DEFAULT now()
);

-- =============================================
-- Row Level Security
-- =============================================
ALTER TABLE rsvp ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishes ENABLE ROW LEVEL SECURITY;

-- Public read for gallery and wishes
CREATE
POLICY "photos_public_read"
  ON photos FOR
SELECT USING (true);

CREATE
POLICY "wishes_public_read"
  ON wishes FOR
SELECT USING (true);

-- Writes — only via service_role (our API Routes)
-- INSERT without an explicit policy = denied for anon/authenticated
-- service_role key bypasses RLS — this is what API Routes use

-- =============================================
-- Indexes for performance
-- =============================================
CREATE INDEX idx_photos_uploaded_at ON photos (uploaded_at DESC);
CREATE INDEX idx_wishes_created_at ON wishes (created_at DESC);
CREATE INDEX idx_rsvp_created_at ON rsvp (created_at DESC);
CREATE INDEX idx_rsvp_attending ON rsvp (attending);

-- One RSVP row per non-null email / phone (API upserts on conflict).
CREATE UNIQUE INDEX rsvp_email_unique ON rsvp (email) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX rsvp_phone_unique ON rsvp (phone) WHERE phone IS NOT NULL;
```

### Why RLS matters

`SUPABASE_ANON_KEY` goes to the frontend (it is public by nature). Without RLS anyone could directly delete all data via
the Supabase REST API. With RLS + service_role key only on the server — the client physically cannot write to the DB
directly.

### `lib/supabase.ts`

```typescript
import {createClient} from '@supabase/supabase-js'

// Server client — uses service_role, bypasses RLS
// Only for API Routes and Server Components
export function createServerClient() {
    return createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
}

// Browser client — uses anon key, respects RLS
// Read-only (gallery, wishes)
export function createBrowserClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )
}
```

---

## Phase 0 — Environment setup

**Goal:** create all accounts and collect all keys before writing any code.

### 0.1 Vercel

1. Sign up at vercel.com
2. Install CLI: `npm i -g vercel`
3. `vercel login`

### 0.2 Supabase

1. Sign up at supabase.com
2. New Project → enter a name and DB password
3. Settings → API → copy:
    - Project URL → `SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_URL`
    - anon key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    - service_role key → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ server only
4. SQL Editor → run the schema from section 7

### 0.3 Cloudflare R2

1. Sign up at cloudflare.com
2. R2 Object Storage → Create bucket → `wedding-photos`
3. Settings → Custom Domains → attach `media.yourdomain.com`
4. Manage R2 API Tokens → Create API Token:
    - Permissions: Object Read & Write
    - Specific bucket: `wedding-photos`
5. Copy Account ID, Access Key ID, Secret Access Key
6. `R2_PUBLIC_URL` = `https://media.yourdomain.com`

### 0.4 Resend

1. Sign up at resend.com
2. Domains → Add Domain → verify DNS records
3. API Keys → Create API Key → copy → `RESEND_API_KEY`
4. Inbound mail (optional — admin inbox): verify the domain for inbound in Resend (MX to Resend), then set `RESEND_WEBHOOK_PUBLIC_URL`, `RESEND_WEBHOOK_SIGNING_SECRET`, and `RESEND_INBOUND_DOMAIN` as in §0.5.

### 0.5 `.env.local`

```bash
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # SECRET — server only
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Cloudflare R2
R2_ACCOUNT_ID=xxx
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET_NAME=wedding-photos
R2_PUBLIC_URL=https://media.yourdomain.com

# Resend
RESEND_API_KEY=re_xxx
# Inbound mail (Resend email.received → Svix webhook); see Phase 0.4 / inbound-mail feature README
RESEND_WEBHOOK_PUBLIC_URL=https://yourdomain.com/api/webhooks/resend/inbound
RESEND_WEBHOOK_SIGNING_SECRET=whsec_xxx
RESEND_INBOUND_DOMAIN=yourdomain.com

# Admin
ADMIN_EMAIL=your@email.com
ADMIN_SECRET=choose-a-long-random-string-here
```

The repository root includes **`env.example`** with the same keys and placeholders; copy it to `.env.local`. You can also duplicate it as **`.env.example`** locally if your workflow expects that filename (`.gitignore` allows tracking `.env.example`).

---

## Phase 1 — Scaffolding and deploy

**Goal:** a working project deployed on Vercel with zero content.

### 1.1 Create the project

```bash
npx create-next-app@latest wedding \
  --typescript \
  --tailwind \
  --app \
  --import-alias "@/*"
cd wedding
```

### 1.2 Install dependencies

```bash
npm install \
  next-intl \
  @supabase/supabase-js \
  @aws-sdk/client-s3 \
  @aws-sdk/s3-request-presigner \
  resend \
  react-intersection-observer \
  clsx \
  tailwind-merge
```

### 1.3 `lib/utils.ts`

```typescript
import {clsx, type ClassValue} from 'clsx'
import {twMerge} from 'tailwind-merge'

// Merge Tailwind classes without conflicts
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}
```

### 1.4 `vercel.json` — Cron keep-alive

```json
{
  "crons": [
    {
      "path": "/api/ping",
      "schedule": "0 9 */5 * *"
    }
  ]
}
```

### 1.5 `app/api/ping/route.ts`

```typescript
import {createServerClient} from '@/lib/supabase'

export async function GET() {
    const supabase = createServerClient()
    await supabase.from('rsvp').select('id').limit(1)
    return Response.json({ok: true, ts: new Date().toISOString()})
}
```

**Why this is needed:** Supabase Free goes to sleep after 7 days of inactivity. A guest visiting to submit their RSVP
during a quiet period would see the site "waking up" for 20–30 sec. A cron every 5 days solves this completely.

### 1.6 First deploy

```bash
vercel          # interactive wizard, links to Vercel

# Add env variables in Vercel Dashboard:
# Settings → Environment Variables → add all from .env
# Mark SUPABASE_SERVICE_ROLE_KEY and ADMIN_SECRET as "Sensitive"

vercel --prod   # production deploy
```

---

## Phase 2 — Design System and UI primitives

**Goal:** create all base components used across every section.

### 2.1 Fonts — `app/[locale]/layout.tsx`

```typescript
import {Cormorant_Garamond, Lato, Great_Vibes} from 'next/font/google'
import {NextIntlClientProvider} from 'next-intl'
import {getMessages} from 'next-intl/server'

const fontDisplay = Cormorant_Garamond({
    subsets: ['latin', 'cyrillic'],
    weight: ['300', '400', '600'],
    variable: '--font-display',
    display: 'swap',
})

const fontBody = Lato({
    subsets: ['latin', 'latin-ext'],
    weight: ['300', '400', '700'],
    variable: '--font-body',
    display: 'swap',
})

const fontAccent = Great_Vibes({
    subsets: ['latin'],
    weight: ['400'],
    variable: '--font-accent',
    display: 'swap',
})

export default async function RootLayout({
                                             children,
                                             params: {locale},
                                         }: {
    children: React.ReactNode
    params: { locale: string }
}) {
    const messages = await getMessages()

    return (
        <html lang = {locale}
    className = {`${fontDisplay.variable} ${fontBody.variable} ${fontAccent.variable}`
}>
    <body>
        <NextIntlClientProvider messages = {messages} >
        {children}
        < /NextIntlClientProvider>
        < /body>
        < /html>
)
}
```

### 2.2 `components/ui/Section.tsx`

```typescript
import {cn} from '@/lib/utils'

type SectionTheme = 'base' | 'alt' | 'dark'

export function Section({
                            id,
                            theme = 'base',
                            className,
                            children,
                        }: {
    id?: string
    theme?: SectionTheme
    className?: string
    children: React.ReactNode
}) {
    const bgMap: Record<SectionTheme, string> = {
        base: 'bg-bg-base',
        alt: 'bg-bg-section',
        dark: 'bg-text-primary',
    }

    return (
        <section
            id = {id}
    data - theme = {theme === 'dark' ? 'dark-section' : undefined
}
    className = {cn('py-[var(--spacing-section)]', bgMap[theme], className
)
}
>
    <div
        className = "mx-auto px-4 sm:px-8"
    style = {
    {
        maxWidth: 'var(--max-width)'
    }
}
>
    {
        children
    }
    </div>
    < /section>
)
}
```

### 2.3 `components/ui/SectionHeader.tsx`

```typescript
import {cn} from '@/lib/utils'

export function SectionHeader({
                                  title,
                                  subtitle,
                                  centered = true,
                                  className,
                              }: {
    title: string
    subtitle?: string
    centered?: boolean
    className?: string
}) {
    return (
        <div className = {cn('mb-12', centered && 'text-center', className)
}>
    <h2 className = "font-display text-h2 text-text-primary mb-3" > {title} < /h2>
    {
        subtitle && (
            <p className = "text-text-secondary text-body max-w-[var(--content-width)] mx-auto" >
                {subtitle}
                < /p>
        )
    }
    {/* Decorative divider */
    }
    <div className = "flex items-center justify-center gap-3 mt-6" >
    <div className = "h-px w-16 bg-border" / >
    <div className = "w-1.5 h-1.5 rounded-pill bg-primary" / >
    <div className = "h-px w-16 bg-border" / >
        </div>
        < /div>
)
}
```

### 2.4 `components/ui/Button.tsx`

```typescript
import {cn} from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline'
type Size = 'sm' | 'md' | 'lg'

const variants: Record<Variant, string> = {
    primary: 'bg-primary text-text-onPrimary hover:bg-primary-dark shadow-button',
    secondary: 'bg-bg-section text-text-primary hover:bg-border',
    ghost: 'text-primary hover:bg-primary/10',
    outline: 'border border-primary text-primary hover:bg-primary/10',
}

const sizes: Record<Size, string> = {
    sm: 'px-4 py-2 text-small',
    md: 'px-6 py-3 text-body',
    lg: 'px-8 py-4 text-h3',
}

export function Button({
                           variant = 'primary',
                           size = 'md',
                           className,
                           ...props
                       }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: Variant
    size?: Size
}) {
    return (
        <button
            className = {
            cn(
            'rounded-pill font-body font-medium',
            'transition-[background-color,transform,opacity] duration-fast',
            'active:scale-95',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
            variants[variant],
            sizes[size],
            className
    )
}
    {...
        props
    }
    />
)
}
```

### 2.5 `components/ui/Input.tsx` and `Textarea.tsx`

```typescript
// components/ui/Input.tsx
import {cn} from '@/lib/utils'
import {forwardRef} from 'react'

export const Input = forwardRef<
    HTMLInputElement,
    React.InputHTMLAttributes<HTMLInputElement>
>(({className, ...props}, ref) => (
    <input
        ref = {ref}
className = {
    cn(
    'w-full rounded-md border border-border bg-bg-card',
    'px-4 py-3 text-body text-text-primary',
    'placeholder:text-text-muted',
    'focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary',
    'transition-shadow duration-fast',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    className
)
}
{...
    props
}
/>
))
Input.displayName = 'Input'
```

```typescript
// components/ui/Textarea.tsx
import {cn} from '@/lib/utils'
import {forwardRef} from 'react'

export const Textarea = forwardRef<
    HTMLTextAreaElement,
    React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({className, ...props}, ref) => (
    <textarea
        ref = {ref}
className = {
    cn(
    'w-full rounded-md border border-border bg-bg-card',
    'px-4 py-3 text-body text-text-primary',
    'placeholder:text-text-muted resize-none',
    'focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary',
    'transition-shadow duration-fast',
    className
)
}
{...
    props
}
/>
))
Textarea.displayName = 'Textarea'
```

### 2.6 `components/ui/LanguageSwitcher.tsx`

```typescript
'use client'
import {useLocale} from 'next-intl'
import {useRouter, usePathname} from 'next/navigation'
import {cn} from '@/lib/utils'

export function LanguageSwitcher() {
    const locale = useLocale()
    const router = useRouter()
    const pathname = usePathname()

    function switchTo(newLocale: 'ru' | 'en') {
        const stripped = pathname.replace(/^\/(ru|en)/, '') || '/'
        router.push(`/${newLocale === 'ru' ? '' : newLocale}${stripped}`.replace('//', '/'))
    }

    return (
        <div className = "flex items-center gap-0.5 rounded-pill border border-border p-1" >
            {(['ru', 'en'] as const).map(loc => (
                <button
                    key = {loc}
    onClick = {()
=>
    switchTo(loc)
}
    className = {
        cn(
        'px-3 py-1 rounded-pill text-small font-medium uppercase tracking-wide',
        'transition-colors duration-fast',
        locale === loc
        ? 'bg-primary text-text-onPrimary'
        : 'text-text-secondary hover:text-text-primary'
)
}
>
    {
        loc
    }
    </button>
))
}
    </div>
)
}
```

### 2.7 `components/ui/DynamicForm.tsx` — universal form renderer

```typescript
'use client'
import {useState} from 'react'
import {useTranslations} from 'next-intl'
import {Input} from './Input'
import {Textarea} from './Textarea'
import {Button} from './Button'
import {cn} from '@/lib/utils'
import {FormField, FormValues} from '@/lib/config/rsvp'

// Renders a single field according to its config
function FieldRenderer({
                           field, values, onChange, t,
                       }: {
    field: FormField
    values: FormValues
    onChange: (key: string, value: unknown) => void
    t: ReturnType<typeof useTranslations>
}) {
    if (field.showWhen && !field.showWhen(values)) return null

    const label = t(`fields.${field.key}.label`)
    const placeholder = t(`fields.${field.key}.placeholder`)
    const value = String(values[field.key] ?? '')

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const raw = e.target.value
        onChange(field.key, field.transform ? field.transform(raw) : raw)
    }

    return (
        <div className = "flex flex-col gap-1.5" >
        <label htmlFor = {field.key}
    className = "text-small font-medium text-text-secondary" >
        {label}
    {
        field.required && <span className = "text-primary ml-1"
        aria - hidden > * </span>}
        < /label>

        {
            field.type === 'textarea' ? (
                    <Textarea
                        id = {field.key}
                name = {field.key}
            required = {field.required}
            placeholder = {placeholder}
            value = {value}
            onChange = {handleChange}
            rows = {4}
            maxLength = {field.max}
            />
        ) :
            field.type === 'select' ? (
                    <select
                        id = {field.key}
                name = {field.key}
            value = {value}
            onChange = {handleChange}
            className = "w-full rounded-md border border-border bg-bg-card px-4 py-3
            text - body
            text - text - primary
            focus:outline - none
            focus:ring - 2
            focus:ring - primary / 40
            focus:border - primary
            "
            >
            {
                field.options?.map(opt => (
                    <option key = {String(opt.value)
            }
            value = {String(opt.value
        )
        }>
            {
                opt.labelKey
            }
            </option>
        ))
        }
            </select>
        ) :
            field.type === 'checkbox' ? (
                    <label className = "flex items-center gap-3 cursor-pointer" >
                    <input
                        type = "checkbox"
                id = {field.key}
            checked = {Boolean(values[field.key]
        )
        }
            onChange = {e
        =>
            onChange(field.key, e.target.checked)
        }
            className = "w-4 h-4 accent-primary"
            / >
            <span className = "text-body text-text-primary" > {label} < /span>
                < /label>
        ) :
            (
                <Input
                    id = {field.key}
            type = {field.type}
            name = {field.key}
            required = {field.required}
            placeholder = {placeholder}
            value = {value}
            onChange = {handleChange}
            />
        )
        }
        </div>
    )
    }

    type Status = 'idle' | 'submitting' | 'success' | 'error'

    export function DynamicForm({
                                    fields,
                                    onSubmit,
                                    namespace,
                                }: {
        fields: FormField[]
        onSubmit: (values: FormValues) => Promise<void>
        namespace: string
    }) {
        const t = useTranslations(namespace)
        const [values, setValues] = useState<FormValues>({})
        const [attending, setAttending] = useState<boolean | null>(null)
        const [status, setStatus] = useState<Status>('idle')

        function handleChange(key: string, value: unknown) {
            setValues(prev => ({...prev, [key]: value}))
        }

        async function handleSubmit(e: React.FormEvent) {
            e.preventDefault()
            if (attending === null) return
            setStatus('submitting')
            try {
                await onSubmit({...values, attending})
                setStatus('success')
            } catch {
                setStatus('error')
            }
        }

        if (status === 'success') {
            return (
                <div className = "text-center py-12" >
                <p className = "text-h3 font-display text-text-primary" >
                    {attending ? t('successAttend') : t('successDecline')}
                    < /p>
                    < /div>
            )
        }

        return (
            <form onSubmit = {handleSubmit}
        className = "flex flex-col gap-5 max-w-lg mx-auto" >
            {/* Attending / Not attending toggle */}
            < div
        className = "flex gap-3" >
        <button
            type = "button"
        onClick = {()
    =>
        {
            setAttending(true);
            handleChange('attending', true)
        }
    }
        className = {
            cn(
            'flex-1 py-4 rounded-lg border-2 font-medium transition-colors duration-fast',
            attending === true
            ? 'border-primary bg-primary/10 text-primary'
            : 'border-border text-text-secondary hover:border-primary/50'
    )
    }
    >
        {
            t('willAttend')
        }
        </button>
        < button
        type = "button"
        onClick = {()
    =>
        {
            setAttending(false);
            handleChange('attending', false)
        }
    }
        className = {
            cn(
            'flex-1 py-4 rounded-lg border-2 font-medium transition-colors duration-fast',
            attending === false
            ? 'border-text-muted bg-bg-section text-text-secondary'
            : 'border-border text-text-secondary hover:border-text-muted/50'
    )
    }
    >
        {
            t('wontAttend')
        }
        </button>
        < /div>

        {/* Fields from config — rendered automatically */
        }
        {
            attending !== null && fields.map(field => (
                <FieldRenderer
                    key = {field.key}
            field = {field}
            values = {
            {...
                values, attending
            }
        }
            onChange = {handleChange}
            t = {t}
            />
        ))
        }

        {
            attending !== null && (
                <>
                    {status === 'error' && (
                    <p className = "text-red-500 text-small text-center" > {t('error')
        }
            </p>
        )
        }
            <Button
                type = "submit"
            disabled = {status === 'submitting'
        }
            className = "w-full"
            size = "lg"
            >
            {status === 'submitting' ? t('submitting') : t('submit')
        }
            </Button>
            < />
        )
        }
        </form>
    )
    }
```

---

## Phase 3 — Static sections

### 3.1 Hero

```typescript
// components/sections/Hero.tsx
import {useTranslations} from 'next-intl'
import {WEDDING_DATE, VENUE} from '@/lib/constants'
import {Countdown} from '@/components/ui/Countdown'

export function Hero() {
    const t = useTranslations('hero')

    return (
        <section
            className = "min-h-screen flex flex-col items-center justify-center text-center px-4"
    style = {
    {
        background: 'var(--gradient-hero)'
    }
}
>
    {/* Decorative element */
    }
    <p className = "font-accent text-accent text-[2rem] mb-2"
    aria - hidden >
    forever
    < /p>

    < h1
    className = "font-display text-hero text-text-primary mb-4" >
        {t('names'
)
}
    </h1>

    < p
    className = "text-h3 font-display text-text-secondary mb-2" >
        {t('date'
)
}
    </p>

    < a
    href = {VENUE.mapsUrl}
    target = "_blank"
    rel = "noopener noreferrer"
    className = "text-text-muted hover:text-primary transition-colors text-small mb-12 underline-offset-4 hover:underline"
        >
        {t('venue'
)
}
    </a>

    < Countdown
    targetDate = {WEDDING_DATE}
    />
    < /section>
)
}
```

```typescript
// components/ui/Countdown.tsx
'use client'
import {useState, useEffect} from 'react'
import {useTranslations} from 'next-intl'

interface TimeLeft {
    days: number;
    hours: number;
    minutes: number;
    seconds: number
}

function calcTimeLeft(target: Date): TimeLeft {
    const diff = target.getTime() - Date.now()
    if (diff <= 0) return {days: 0, hours: 0, minutes: 0, seconds: 0}
    return {
        days: Math.floor(diff / 86_400_000),
        hours: Math.floor((diff % 86_400_000) / 3_600_000),
        minutes: Math.floor((diff % 3_600_000) / 60_000),
        seconds: Math.floor((diff % 60_000) / 1_000),
    }
}

export function Countdown({targetDate}: { targetDate: Date }) {
    const t = useTranslations('hero.countdown')
    const [time, setTime] = useState<TimeLeft>(calcTimeLeft(targetDate))
    const passed = targetDate.getTime() <= Date.now()

    useEffect(() => {
        if (passed) return
        const id = setInterval(() => setTime(calcTimeLeft(targetDate)), 1_000)
        return () => clearInterval(id)
    }, [targetDate, passed])

    if (passed) return <p className = "text-text-secondary" > {t('passed'
)
}
    </p>

    return (
        <div className = "grid grid-cols-4 gap-6" >
            {([
                {value: time.days, label: t('days')},
                {value: time.hours, label: t('hours')},
                {value: time.minutes, label: t('minutes')},
                {value: time.seconds, label: t('seconds')},
            ] as const).map(({value, label}) => (
                <div key = {label}
    className = "flex flex-col items-center gap-1" >
    <span className = "font-display text-hero text-text-primary tabular-nums" >
        {String(value).padStart(2, '0')}
        < /span>
        < span
    className = "text-xs uppercase tracking-widest text-text-muted" >
        {label}
        < /span>
        < /div>
))
}
    </div>
)
}
```

### 3.2 Schedule

```typescript
// components/sections/Schedule.tsx
import {useTranslations} from 'next-intl'
import {SCHEDULE} from '@/lib/config/schedule'
import {Section} from '@/components/ui/Section'
import {SectionHeader} from '@/components/ui/SectionHeader'

export function Schedule() {
    const t = useTranslations()

    return (
        <Section id = "schedule"
    theme = "alt" >
    <SectionHeader
        title = {t('schedule.title'
)
}
    subtitle = {t('schedule.subtitle'
)
}
    />

    < div
    className = "relative max-w-2xl mx-auto" >
        {/* Vertical timeline line */}
        < div
    className = "absolute left-8 top-0 bottom-0 w-px bg-border" / >

    <div className = "flex flex-col gap-8" >
        {
            SCHEDULE.map((item, index) => (
                <div key = {item.id} className = "flex gap-6 items-start" >
                {/* Icon circle */}
                < div className = "relative flex-shrink-0 w-16 h-16 rounded-pill
            bg-bg - card border-2 border-border shadow-sm
            flex items - center justify-center text-2xl z - 10">
    {
        item.icon
    }
    </div>

    {/* Content */
    }
    <div className = "flex-1 pt-2 pb-6" >
    <div className = "flex items-baseline gap-3 mb-1" >
    <span className = "text-small font-medium text-primary font-mono" >
        {item.time}
        < /span>
        < h3
    className = "font-display text-h3 text-text-primary" >
        {t(item.titleKey
)
}
    </h3>
    < /div>
    < p
    className = "text-text-secondary text-body" >
        {t(item.descKey
)
}
    </p>
    {
        item.location && item.locationUrl && (
            <a
                href = {item.locationUrl}
        target = "_blank"
        rel = "noopener noreferrer"
        className = "inline-flex items-center gap-1 mt-2 text-small
        text - primary
        hover:text - primary - dark
        transition - colors
        "
        >
                                        📍 {
        item.location
    }
        </a>
    )
    }
    </div>
    < /div>
))
}
    </div>
    < /div>
    < /Section>
)
}
```

### 3.3 DressCode

```typescript
// components/sections/DressCode.tsx
'use client'
import {useState} from 'react'
import {useTranslations} from 'next-intl'
import {PALETTE} from '@/lib/config/dresscode'
import {Section} from '@/components/ui/Section'
import {SectionHeader} from '@/components/ui/SectionHeader'
import {cn} from '@/lib/utils'

export function DressCode() {
    const t = useTranslations('dresscode')
    const [selected, setSelected] = useState<string | null>(null)

    const selectedColor = PALETTE.find(c => c.hex === selected)

    return (
        <Section id = "dresscode" >
        <SectionHeader
            title = {t('title')
}
    subtitle = {t('subtitle'
)
}
    />

    {/* Colour palette */
    }
    <div className = "grid grid-cols-4 sm:grid-cols-7 gap-4 justify-items-center mb-10" >
        {
            PALETTE.map(color => (
                <button
                    key = {color.hex}
            onClick = {()
=>
    setSelected(selected === color.hex ? null : color.hex)
}
    className = "flex flex-col items-center gap-2 group"
    title = {t(`colors.${color.key}`
)
}
>
    <div
        className = {
        cn(
        'w-14 h-14 sm:w-16 sm:h-16 rounded-pill border-4 transition-all duration-normal',
        'group-hover:scale-110',
        selected === color.hex
        ? 'border-text-primary scale-110 shadow-card'
        : 'border-transparent',
    !color.allowed && 'opacity-40'
)
}
    style = {
    {
        background: color.hex
    }
}
    />
    < span
    className = "text-xs text-text-muted text-center leading-tight" >
        {t(`colors.${color.key}`
)
}
    </span>
    {
        !color.allowed && (
            <span className = "text-xs text-red-400" > {t('notAllowed')
    }
        </span>
    )
    }
    </button>
))
}
    </div>

    {/* Selected colour preview */
    }
    {
        selectedColor && (
            <div
                className = "max-w-sm mx-auto rounded-lg p-8 text-center shadow-card
        transition - all
        duration - normal
        "
        style = {
        {
            background: selectedColor.hex
        }
    }
    >
        <p
            className = "font-display text-h3"
        style = {
        {
            color: selectedColor.allowed ? '#2C2420' : '#991B1B'
        }
    }
    >
        {
            selectedColor.allowed ? t('yourColor') : t('notYourColor')
        }
        </p>
        < p
        className = "text-small mt-1"
        style = {
        {
            color: '#6B5C54'
        }
    }>
        {
            t(`colors.${selectedColor.key}`)
        }
        </p>
        < /div>
    )
    }
    </Section>
)
}
```

### 3.4 Content sections (Welcome, OurStory)

```typescript
// components/sections/Welcome.tsx
import {getLocale} from 'next-intl/server'
import {useTranslations} from 'next-intl'
import {Section} from '@/components/ui/Section'
import {SectionHeader} from '@/components/ui/SectionHeader'

export async function Welcome() {
    const t = useTranslations('welcome')
    const locale = await getLocale()

    // Dynamic MDX import based on current locale
    const {default: WelcomeContent} =
        await import(`@/content/welcome/${locale}.mdx`)

    return (
        <Section id = "welcome"
    theme = "alt" >
    <div
        className = "prose prose-stone max-w-[var(--content-width)] mx-auto text-center"
    style = {
    {
        fontFamily: 'var(--font-display)'
    }
}
>
    <SectionHeader title = {t('title'
)
}
    />
    < WelcomeContent / >
    </div>
    < /Section>
)
}

// OurStory.tsx follows the same pattern — change namespace and content path
```

---

## Phase 4 — RSVP

### 4.1 API Route

```typescript
// app/api/rsvp/route.ts
import {createServerClient} from '@/lib/supabase'
import {sendRsvpEmail} from '@/lib/resend'
import {z} from 'zod'

const schema = z.object({
    name: z.string().min(2).max(100),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().max(30).optional(),
    attending: z.boolean(),
    guest_count: z.number().min(1).max(10).optional().default(1),
    dietary: z.string().max(500).optional(),
    message: z.string().max(1000).optional(),
    // If you add needsTransfer to the config — add the line below:
    // needsTransfer: z.boolean().optional(),
})

export async function POST(req: Request) {
    let body: unknown
    try {
        body = await req.json()
    } catch {
        return Response.json({error: 'Invalid JSON'}, {status: 400})
    }

    const parsed = schema.safeParse(body)
    if (!parsed.success) {
        return Response.json({error: parsed.error.flatten()}, {status: 400})
    }

    const data = parsed.data
    const supabase = createServerClient()

    const {error} = await supabase.from('rsvp').insert({
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        attending: data.attending,
        guest_count: data.attending ? data.guest_count : 1,
        dietary: data.attending ? data.dietary || null : null,
        message: data.message || null,
    })

    if (error) {
        console.error('Supabase insert error:', error)
        return Response.json({error: 'Database error'}, {status: 500})
    }

    // Send email asynchronously — don't block the response to the client
    sendRsvpEmail(data).catch(err => console.error('Email error:', err))

    return Response.json({ok: true})
}
```

### 4.2 Email — `lib/resend.ts`

```typescript
import {Resend} from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface RSVPData {
    name: string
    email?: string
    phone?: string
    attending: boolean
    guest_count?: number
    dietary?: string
    message?: string
}

export async function sendRsvpEmail(data: RSVPData) {
    const statusEmoji = data.attending ? '✅' : '❌'
    const statusText = data.attending ? 'Attending' : 'Not attending'
    const guests = data.attending && (data.guest_count ?? 1) > 1
        ? ` (+${(data.guest_count ?? 1) - 1} guest(s))`
        : ''

    return resend.emails.send({
        from: `Wedding <no-reply@yourdomain.com>`,
        to: process.env.ADMIN_EMAIL!,
        subject: `${statusEmoji} RSVP: ${data.name}${guests} — ${statusText}`,
        html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #C9A69A; border-bottom: 1px solid #E8DDD8; padding-bottom: 12px;">
          New RSVP — ${data.name}
        </h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px; color: #6B5C54; width: 140px;"><b>Status</b></td>
              <td style="padding: 8px;">${statusEmoji} ${statusText}</td></tr>
          <tr><td style="padding: 8px; color: #6B5C54;"><b>Name</b></td>
              <td style="padding: 8px;">${data.name}</td></tr>
          <tr><td style="padding: 8px; color: #6B5C54;"><b>Guests</b></td>
              <td style="padding: 8px;">${data.guest_count ?? 1}</td></tr>
          <tr><td style="padding: 8px; color: #6B5C54;"><b>Email</b></td>
              <td style="padding: 8px;">${data.email || '—'}</td></tr>
          <tr><td style="padding: 8px; color: #6B5C54;"><b>Phone</b></td>
              <td style="padding: 8px;">${data.phone || '—'}</td></tr>
          <tr><td style="padding: 8px; color: #6B5C54;"><b>Dietary</b></td>
              <td style="padding: 8px;">${data.dietary || '—'}</td></tr>
          <tr><td style="padding: 8px; color: #6B5C54;"><b>Message</b></td>
              <td style="padding: 8px;">${data.message || '—'}</td></tr>
        </table>
      </body>
      </html>
    `,
    })
}
```

### 4.3 RSVP section

```typescript
// components/sections/RSVP.tsx
'use client'
import {useTranslations} from 'next-intl'
import {DynamicForm} from '@/components/ui/DynamicForm'
import {Section} from '@/components/ui/Section'
import {SectionHeader} from '@/components/ui/SectionHeader'
import {RSVP_FIELDS, FormValues} from '@/lib/config/rsvp'

export function RSVP() {
    const t = useTranslations('rsvp')

    async function handleSubmit(values: FormValues) {
        const res = await fetch('/api/rsvp', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(values),
        })
        if (!res.ok) throw new Error('Failed')
    }

    return (
        <Section id = "rsvp"
    theme = "alt" >
    <SectionHeader
        title = {t('title'
)
}
    subtitle = {t('subtitle'
)
}
    />
    < DynamicForm
    fields = {RSVP_FIELDS}
    onSubmit = {handleSubmit}
    namespace = "rsvp"
        / >
        </Section>
)
}
```

---

## Phase 5 — Photo gallery

### Upload architecture

```
Guest browser
  │
  ├─ 1. POST /api/upload/presign
  │        Body: { contentType, size }
  │◄─ Response: { url (presigned PUT URL), key }
  │
  ├─ 2. PUT presignedUrl ──────────► Cloudflare R2 (directly)
  │        Body: File
  │        (server NOT involved, no size bottleneck)
  │
  └─ 3. POST /api/upload/confirm
           Body: { key, uploaderName }
           └─► INSERT INTO photos
```

**CORS on the R2 bucket** is required for this flow (browser `PUT` to `*.r2.cloudflarestorage.com`). Apply the JSON in *
*`docs/r2-cors-dashboard.json`** following **`docs/r2-cors.md`**. If you cannot configure CORS (or hit platform
body-size limits), use **`POST /api/upload/server`** and set **`NEXT_PUBLIC_GALLERY_SERVER_UPLOAD=true`** (
`@features/gallery-upload`).

### `lib/r2.ts`

```typescript
import {S3Client, PutObjectCommand} from '@aws-sdk/client-s3'
import {getSignedUrl} from '@aws-sdk/s3-request-presigner'
import {randomUUID} from 'crypto'

export const r2 = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
})

export async function createPresignedUploadUrl(contentType: string) {
    const ext = contentType.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg'
    const key = `photos/${randomUUID()}.${ext}`

    const url = await getSignedUrl(
        r2,
        new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME!,
            Key: key,
            ContentType: contentType,
        }),
        {expiresIn: 300} // 5 minutes — enough time for the guest to upload
    )

    return {url, key}
}
```

### `app/api/upload/presign/route.ts`

```typescript
import {createPresignedUploadUrl} from '@/lib/r2'
import {z} from 'zod'

const ALLOWED_TYPES = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic',
] as const

const MAX_SIZE = 5 * 1024 * 1024  // 5 MB

const schema = z.object({
    contentType: z.enum(ALLOWED_TYPES),
    size: z.number().max(MAX_SIZE, 'File too large'),
})

export async function POST(req: Request) {
    const body = await req.json().catch(() => null)
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
        return Response.json({error: 'Invalid file type or size'}, {status: 400})
    }

    const {url, key} = await createPresignedUploadUrl(parsed.data.contentType)
    return Response.json({url, key})
}
```

### `app/api/upload/confirm/route.ts`

```typescript
import {createServerClient} from '@/lib/supabase'
import {z} from 'zod'

const schema = z.object({
    key: z.string().min(1).startsWith('photos/'),
    uploaderName: z.string().min(1).max(100),
    sizeBytes: z.number().optional(),
})

export async function POST(req: Request) {
    const body = await req.json().catch(() => null)
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
        return Response.json({error: 'Invalid data'}, {status: 400})
    }

    const {key, uploaderName, sizeBytes} = parsed.data
    const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`
    const supabase = createServerClient()

    const {error} = await supabase.from('photos').insert({
        r2_key: key,
        uploader_name: uploaderName,
        public_url: publicUrl,
        size_bytes: sizeBytes ?? null,
    })

    if (error) {
        return Response.json({error: 'Database error'}, {status: 500})
    }

    return Response.json({ok: true, url: publicUrl})
}
```

### `components/ui/PhotoUploader.tsx`

```typescript
'use client'
import {useState, useCallback} from 'react'
import {useTranslations} from 'next-intl'
import {Button} from './Button'
import {Input} from './Input'
import {cn} from '@/lib/utils'

const MAX_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic']
const MAX_PARALLEL = 3   // Concurrent uploads at a time

type FileStatus = 'pending' | 'uploading' | 'done' | 'error'

interface UploadFile {
    file: File;
    status: FileStatus;
    progress: number
}

async function uploadOne(
    file: File,
    uploaderName: string,
    onProgress: (p: number) => void
): Promise<void> {
    // 1. Get presigned URL
    const presignRes = await fetch('/api/upload/presign', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({contentType: file.type, size: file.size}),
    })
    if (!presignRes.ok) throw new Error('Presign failed')
    const {url, key} = await presignRes.json()
    onProgress(30)

    // 2. Upload directly to R2
    const uploadRes = await fetch(url, {
        method: 'PUT',
        headers: {'Content-Type': file.type},
        body: file,
    })
    if (!uploadRes.ok) throw new Error('Upload failed')
    onProgress(80)

    // 3. Confirm
    const confirmRes = await fetch('/api/upload/confirm', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({key, uploaderName, sizeBytes: file.size}),
    })
    if (!confirmRes.ok) throw new Error('Confirm failed')
    onProgress(100)
}

export function PhotoUploader() {
    const t = useTranslations('gallery')
    const [files, setFiles] = useState<UploadFile[]>([])
    const [name, setName] = useState('')
    const [isDragging, setDragging] = useState(false)
    const [allDone, setAllDone] = useState(false)

    const addFiles = useCallback((newFiles: File[]) => {
        const valid = newFiles.filter(
            f => ALLOWED_TYPES.includes(f.type) && f.size <= MAX_SIZE
        )
        setFiles(prev => [...prev, ...valid.map(f => ({
            file: f, status: 'pending' as FileStatus, progress: 0,
        }))])
    }, [])

    function handleDrop(e: React.DragEvent) {
        e.preventDefault()
        setDragging(false)
        addFiles(Array.from(e.dataTransfer.files))
    }

    function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
        addFiles(Array.from(e.target.files ?? []))
    }

    function updateFile(index: number, updates: Partial<UploadFile>) {
        setFiles(prev => prev.map((f, i) => i === index ? {...f, ...updates} : f))
    }

    async function handleUpload() {
        if (!name.trim() || files.length === 0) return

        const pending = files
            .map((f, i) => ({...f, index: i}))
            .filter(f => f.status === 'pending')

        // Batch upload — MAX_PARALLEL at a time
        for (let i = 0; i < pending.length; i += MAX_PARALLEL) {
            const batch = pending.slice(i, i + MAX_PARALLEL)
            await Promise.all(batch.map(({file, index}) => {
                updateFile(index, {status: 'uploading'})
                return uploadOne(
                    file,
                    name,
                    (p) => updateFile(index, {progress: p})
                )
                    .then(() => updateFile(index, {status: 'done', progress: 100}))
                    .catch(() => updateFile(index, {status: 'error'}))
            }))
        }

        setAllDone(true)
    }

    if (allDone) {
        return <p className = "text-center py-8 text-text-secondary" > {t('done'
    )
    }
        </p>
    }

    return (
        <div className = "flex flex-col gap-5" >
        <Input
            value = {name}
    onChange = {e
=>
    setName(e.target.value)
}
    placeholder = {t('uploaderName'
)
}
    />

    {/* Dropzone */
    }
    <div
        onDrop = {handleDrop}
    onDragOver = {e
=>
    {
        e.preventDefault();
        setDragging(true)
    }
}
    onDragLeave = {()
=>
    setDragging(false)
}
    onClick = {()
=>
    document.getElementById('photo-input')?.click()
}
    className = {
        cn(
        'border-2 border-dashed rounded-lg p-10 text-center cursor-pointer',
        'transition-colors duration-fast',
        isDragging
        ? 'border-primary bg-primary/5'
        : 'border-border hover:border-primary/50 hover:bg-bg-section'
)
}
>
    <p className = "text-text-secondary mb-1" > {t('dropzone'
)
}
    </p>
    < p
    className = "text-text-muted text-small" > {t('maxSize'
)
}
    </p>
    < input
    id = "photo-input"
    type = "file"
    multiple
    accept = {ALLOWED_TYPES.join(',')}
    className = "hidden"
    onChange = {handleInput}
    />
    < /div>

    {/* File list with progress bars */
    }
    {
        files.length > 0 && (
            <div className = "flex flex-col gap-2 max-h-60 overflow-y-auto" >
                {
                    files.map(({file, status, progress}, i) => (
                        <div key = {i} className = "flex items-center gap-3" >
                    <span className = "text-small text-text-secondary flex-1 truncate" >
                        {file.name}
                        < /span>
        {
            status === 'uploading' && (
                <div className = "w-24 h-1.5 rounded-pill bg-border overflow-hidden" >
                <div
                    className = "h-full bg-primary transition-all duration-fast"
            style = {
            {
                width: `${progress}%`
            }
        }
            />
            < /div>
        )
        }
        {
            status === 'done' && <span className = "text-green-500 text-small" >✓</span>}
            {
                status === 'error' && <span className = "text-red-400 text-small" >✗</span>}
            < /div>
            ))
            }
            </div>
        )
        }

        {
            files.length > 0 && (
                <Button
                    onClick = {handleUpload}
            disabled = {!
            name.trim()
        }
            className = "w-full"
                >
                {t('upload'
        )
        }
            ({files.filter(f => f.status === 'pending').length})
            < /Button>
        )
        }
        </div>
    )
    }
```

### `components/sections/Gallery.tsx` — infinite scroll

```typescript
'use client'
import {useEffect, useState} from 'react'
import {useInView} from 'react-intersection-observer'
import {useTranslations} from 'next-intl'
import {createBrowserClient} from '@/lib/supabase'
import {PhotoUploader} from '@/components/ui/PhotoUploader'
import {Section} from '@/components/ui/Section'
import {SectionHeader} from '@/components/ui/SectionHeader'

interface Photo {
    id: string
    public_url: string
    uploader_name: string | null
    uploaded_at: string
}

const PAGE_SIZE = 20

export function Gallery() {
    const t = useTranslations('gallery')
    const supabase = createBrowserClient()

    const [photos, setPhotos] = useState<Photo[]>([])
    const [page, setPage] = useState(0)
    const [hasMore, setHasMore] = useState(true)
    const [loading, setLoading] = useState(false)
    const [showUploader, setShowUploader] = useState(false)

    const {ref, inView} = useInView({threshold: 0, rootMargin: '200px'})

    useEffect(() => {
        if (inView && hasMore && !loading) loadMore()
    }, [inView])

    async function loadMore() {
        setLoading(true)
        const {data, error} = await supabase
            .from('photos')
            .select('id, public_url, uploader_name, uploaded_at')
            .order('uploaded_at', {ascending: false})
            .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

        if (!error && data) {
            setPhotos(prev => [...prev, ...data])
            if (data.length < PAGE_SIZE) setHasMore(false)
            setPage(prev => prev + 1)
        }
        setLoading(false)
    }

    return (
        <Section id = "gallery"
    theme = "alt" >
    <SectionHeader title = {t('title'
)
}
    subtitle = {t('subtitle'
)
}
    />

    {/* Upload toggle button */
    }
    <div className = "text-center mb-8" >
    <button
        onClick = {()
=>
    setShowUploader(prev => !prev)
}
    className = "text-primary hover:text-primary-dark underline underline-offset-4
    transition - colors
    text - body
    "
    >
    {t('upload'
)
} 📷
                </button>
                < /div>

    {
        showUploader && (
            <div className = "max-w-lg mx-auto mb-12 p-6 bg-bg-card rounded-lg shadow-card" >
                <PhotoUploader / >
                </div>
        )
    }

    {/* Masonry grid */
    }
    {
        photos.length === 0 && !loading ? (
            <p className = "text-center text-text-muted py-12" > {t('empty')
    }
        </p>
    ) :
        (
            <div className = "columns-2 sm:columns-3 lg:columns-4 gap-3" >
                {
                    photos.map(photo => (
                        <a
                            key = {photo.id}
                    href = {photo.public_url}
                    target = "_blank"
                    rel = "noopener noreferrer"
                    className = "block mb-3 rounded-md overflow-hidden shadow-sm
                    hover: shadow - card transition-shadow duration-normal group"
                    >
                    <img
                        src = {photo.public_url}
                    alt = {photo.uploader_name ?? 'Wedding photo'}
                    loading = "lazy"
                    className = "w-full group-hover:scale-105 transition-transform duration-slow"
                        / >
                        </a>
        )
    )
    }
        </div>
    )
    }

    {/* Sentinel for infinite scroll */
    }
    <div ref = {ref}
    className = "h-10 mt-4" / >
        {!
    hasMore && photos.length > 0 && (
        <p className = "text-center text-text-muted text-small mt-4" > {t('allLoaded')
}
    </p>
)
}
    </Section>
)
}
```

---

## Phase 6 — Wishes

### `app/api/wishes/route.ts`

```typescript
import {createServerClient} from '@/lib/supabase'
import {z} from 'zod'

const schema = z.object({
    authorName: z.string().min(1).max(100),
    message: z.string().min(1).max(2000),
    r2Key: z.string().startsWith('photos/').optional(),
})

export async function POST(req: Request) {
    const body = await req.json().catch(() => null)
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
        return Response.json({error: 'Invalid data'}, {status: 400})
    }

    const {authorName, message, r2Key} = parsed.data
    const photoUrl = r2Key ? `${process.env.R2_PUBLIC_URL}/${r2Key}` : null
    const supabase = createServerClient()

    const {error} = await supabase.from('wishes').insert({
        author_name: authorName,
        message,
        photo_r2_key: r2Key ?? null,
        photo_url: photoUrl,
    })

    if (error) return Response.json({error: 'Database error'}, {status: 500})
    return Response.json({ok: true})
}
```

### `components/sections/Wishes.tsx`

```typescript
'use client'
import {useState, useEffect} from 'react'
import {useTranslations} from 'next-intl'
import {useInView} from 'react-intersection-observer'
import {createBrowserClient} from '@/lib/supabase'
import {Section} from '@/components/ui/Section'
import {SectionHeader} from '@/components/ui/SectionHeader'
import {Input} from '@/components/ui/Input'
import {Textarea} from '@/components/ui/Textarea'
import {Button} from '@/components/ui/Button'

interface Wish {
    id: string
    author_name: string
    message: string
    photo_url: string | null
    created_at: string
}

// Photo upload for wishes — same mechanism as Gallery
async function uploadWishPhoto(file: File): Promise<string> {
    const res = await fetch('/api/upload/presign', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({contentType: file.type, size: file.size}),
    })
    const {url, key} = await res.json()
    await fetch(url, {method: 'PUT', headers: {'Content-Type': file.type}, body: file})
    return key
}

export function Wishes() {
    const t = useTranslations('wishes')
    const supabase = createBrowserClient()

    const [wishes, setWishes] = useState<Wish[]>([])
    const [name, setName] = useState('')
    const [message, setMessage] = useState('')
    const [photo, setPhoto] = useState<File | null>(null)
    const [status, setStatus] = useState<'idle' | 'submitting' | 'done'>('idle')

    const {ref, inView} = useInView({threshold: 0, triggerOnce: true})

    useEffect(() => {
        if (inView) loadWishes()
    }, [inView])

    async function loadWishes() {
        const {data} = await supabase
            .from('wishes')
            .select('*')
            .order('created_at', {ascending: false})
            .limit(50)
        if (data) setWishes(data)
    }

    async function handleSubmit() {
        if (!name.trim() || !message.trim()) return
        setStatus('submitting')

        let r2Key: string | undefined
        if (photo) {
            r2Key = await uploadWishPhoto(photo)
        }

        const res = await fetch('/api/wishes', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({authorName: name, message, r2Key}),
        })

        if (res.ok) {
            setStatus('done')
            await loadWishes()
        }
    }

    return (
        <Section id = "wishes" >
        <SectionHeader title = {t('title')
}
    subtitle = {t('subtitle'
)
}
    />

    {/* Form */
    }
    <div className = "max-w-lg mx-auto mb-16 p-6 bg-bg-card rounded-lg shadow-card" >
    {status === 'done' ? (
        <p className = "text-center text-text-secondary py-6" > {t('success')
}
    </p>
) :
    (
        <div className = "flex flex-col gap-4" >
        <Input
            placeholder = {t('name')
}
    value = {name}
    onChange = {e
=>
    setName(e.target.value)
}
    />
    < Textarea
    placeholder = {t('message'
)
}
    value = {message}
    onChange = {e
=>
    setMessage(e.target.value)
}
    rows = {4}
    />
    < label
    className = "flex items-center gap-2 text-small text-text-muted cursor-pointer" >
    <input
        type = "file"
    accept = "image/*"
    className = "hidden"
    onChange = {e
=>
    setPhoto(e.target.files?.[0] ?? null)
}
    />
    < span
    className = "text-primary" >📷</span>
    {
        photo ? photo.name : t('addPhoto')
    }
    </label>
    < Button
    onClick = {handleSubmit}
    disabled = {status === 'submitting' || !name || !message
}
    className = "w-full"
    >
    {status === 'submitting' ? '...' : t('submit')
}
    </Button>
    < /div>
)
}
    </div>

    {/* Wish feed — loads when it enters the viewport */
    }
    <div ref = {ref} >
        {
            wishes.length === 0 ? (
                <p className = "text-center text-text-muted" > {t('empty')
        } < /p>
) :
    (
        <div className = "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" >
            {
                wishes.map(wish => (
                    <div key = {wish.id} className = "bg-bg-card p-5 rounded-lg shadow-sm" >
                    {
                        wish.photo_url && (
                            <img
                                src = {wish.photo_url}
                        className = "w-full rounded mb-3 object-cover max-h-40"
                        loading = "lazy"
                            / >
    )
}
    <p className = "text-text-primary mb-3 leading-relaxed" >
        "{wish.message}"
        < /p>
        < p
    className = "text-small text-primary font-medium" >
                                    — {
        wish.author_name
    }
    </p>
    < /div>
))
}
    </div>
)
}
    </div>
    < /Section>
)
}
```

---

## Phase 7 — Donations

### `components/ui/DeepLinkButton.tsx`

```typescript
'use client'
import {useTranslations} from 'next-intl'
import {PaymentConfig, ZELLE_PHONE_NUMBER} from '@/lib/config/payments'
import {cn} from '@/lib/utils'

export function DeepLinkButton({service}: { service: PaymentConfig }) {
    const t = useTranslations('donate')

    async function handleClick() {
        // Zelle: no deep link — copy number to clipboard
        if (!service.deepLink) {
            try {
                await navigator.clipboard.writeText(ZELLE_PHONE_NUMBER)
                alert(t('zelleCopied'))
            } catch {
                alert(`Zelle: ${ZELLE_PHONE_NUMBER}`)
            }
            return
        }

        // Try to open the native app
        window.location.href = service.deepLink

        // After 2 seconds, if the page is still active — open the web version
        setTimeout(() => {
            if (!document.hidden) {
                window.open(service.fallback, '_blank', 'noopener,noreferrer')
            }
        }, 2000)
    }

    return (
        <button
            onClick = {handleClick}
    className = {
        cn(
            service.color,
        'text-white px-7 py-4 rounded-pill',
        'flex items-center gap-3 text-body font-medium',
        'shadow-button active:scale-95 transition-transform duration-fast',
        'hover:opacity-90'
)
}
>
    <span className = "text-xl"
    aria - hidden > {service.icon} < /span>
    < span > {service.label} < /span>
    < /button>
)
}
```

### `components/sections/Donate.tsx`

```typescript
import {useTranslations} from 'next-intl'
import {PAYMENT_SERVICES} from '@/lib/config/payments'
import {Section} from '@/components/ui/Section'
import {SectionHeader} from '@/components/ui/SectionHeader'
import {DeepLinkButton} from '@/components/ui/DeepLinkButton'

export function Donate() {
    const t = useTranslations('donate')

    return (
        <Section id = "donate"
    theme = "alt" >
    <SectionHeader
        title = {t('title'
)
}
    subtitle = {t('subtitle'
)
}
    />

    < div
    className = "flex flex-col sm:flex-row flex-wrap gap-4 justify-center items-center" >
        {
            PAYMENT_SERVICES.map(service => (
                <DeepLinkButton key = {service.id} service = {service}
    />
))
}
    </div>

    < p
    className = "text-center text-text-muted text-small mt-8" >
        {t('noFees'
)
}
    </p>
    < /Section>
)
}
```

---

## Phase 8 — Admin panel

### Access and security

- **Sign-in:** `/admin/login` (and `/ru/admin/login`). Password is verified against **`admin_site_credential.password_hash`** (bcrypt) in Postgres; set with **`npm run admin:set-password`** (service_role). **`POST /api/admin/login`** sets an **httpOnly** cookie with a JWT signed by **`ADMIN_SESSION_SECRET`**.
- **UI:** Middleware allows `/[locale]/admin/login` without a session; other `/[locale]/admin/*` routes require a valid session cookie (JWT). Unauthenticated users are redirected to login (no `?token=` URL flow).
- **API:** Each `/api/admin/*` handler calls **`checkAdminRateLimit`** from `@features/admin-api` first (`login` vs `api` thresholds), then **`isAdminApiAuthorized`** (session cookie or legacy **`ADMIN_SECRET`** via `Authorization: Bearer` / `x-admin-token`). API auth is implemented in route handlers, not only in middleware.
- **Rate limiting:** Table `admin_rate_limit` + RPC `admin_check_rate_limit`. Tunable via **`ADMIN_RATE_LIMIT_LOGIN_*`** and **`ADMIN_RATE_LIMIT_API_*`**.

### Layout and routes (foundation)

- Shell: `src/widgets/admin-shell` — sidebar + logout; stub pages where a screen is not implemented yet.
- See **`src/widgets/admin-shell/README.md`** for how to add a new admin screen.

### Email (templates + broadcast)

- **Tables:** `email_senders` (saved From lines), `email_templates` (optional `sender_id`), `email_send_log` (includes `from_address` per attempt). Migrations + `supabase/schema.sql`. Access only with **service_role** from API routes; RLS enabled with no anon policies (same pattern as other admin tables).
- **Features:** `@features/admin-email-senders` (CRUD senders), `@features/admin-email-templates` (CRUD templates), `@features/admin-email-dispatch` (Resend send + log read). Placeholders in subject/body are **whitelisted** (`{{name}}`, `{{email}}`, … — see feature README). If no sender is selected, dispatch uses `getTransactionalFromAddress()` (`RESEND_FROM_EMAIL`).
- **Routes:** `GET/POST /api/admin/email/senders`, `PATCH/DELETE /api/admin/email/senders/[id]`, `GET/POST /api/admin/email/templates`, `PATCH/DELETE /api/admin/email/templates/[id]`, `POST /api/admin/email/send`, `GET /api/admin/email/log?limit=`. Each handler: `checkAdminRateLimit` → `isAdminApiAuthorized` → feature call.
- **UI:** `src/widgets/admin-email` — `app/[locale]/admin/(dashboard)/email/page.tsx`.
- **Env (optional tuning):** `ADMIN_EMAIL_MAX_BROADCAST_RECIPIENTS` (default 250), `ADMIN_EMAIL_SEND_DELAY_MS` (default 75). Requires **`RESEND_API_KEY`** and a verified **`RESEND_FROM_EMAIL`** (or onboarding sender) for actual delivery — same stack as transactional RSVP mail.
- **Cron:** not used; large broadcasts are intentionally capped per request (documented in `@features/admin-email-dispatch/README.md`).

### `app/[locale]/admin/page.tsx` (legacy example in doc — product uses dashboard stubs)

```typescript
import {createServerClient} from '@/lib/supabase'

interface RSVPRow {
    id: string;
    name: string;
    attending: boolean
    guest_count: number;
    email: string | null
    phone: string | null;
    dietary: string | null
    message: string | null;
    created_at: string
}

interface PhotoRow {
    id: string;
    public_url: string
    uploader_name: string | null;
    uploaded_at: string
}

export default async function AdminPage() {
    const supabase = createServerClient()

    const [{data: rsvps}, {data: photos}, {data: wishes}] = await Promise.all([
        supabase.from('rsvp').select('*').order('created_at', {ascending: false}),
        supabase.from('photos').select('*').order('uploaded_at', {ascending: false}),
        supabase.from('wishes').select('*').order('created_at', {ascending: false}),
    ])

    const attending = rsvps?.filter(r => r.attending) ?? []
    const notAttending = rsvps?.filter(r => !r.attending) ?? []
    const totalGuests = attending.reduce((s, r) => s + (r.guest_count ?? 1), 0)

    return (
        <div className = "p-6 max-w-7xl mx-auto" >
        <h1 className = "font-display text-h1 mb-8" > Admin
    Dashboard < /h1>

    {/* Stats */
    }
    <div className = "grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10" >
        {
            [
                {label: 'Attending', value: attending.length},
    {
        label: 'Not attending', value
    :
        notAttending.length
    }
,
    {
        label: 'Total guests', value
    :
        totalGuests
    }
,
    {
        label: 'Photos', value
    :
        photos?.length ?? 0
    }
,
].
    map(({label, value}) => (
        <div key = {label}
    className = "bg-bg-card rounded-lg p-4 shadow-sm text-center" >
    <p className = "text-h2 font-display text-primary" > {value} < /p>
        < p
    className = "text-small text-text-muted" > {label} < /p>
        < /div>
))
}
    </div>

    {/* RSVP table */
    }
    <h2 className = "font-display text-h2 mb-4" > RSVP({rsvps?.length ?? 0
})
    </h2>
    < div
    className = "overflow-x-auto mb-12" >
    <table className = "w-full text-small border-collapse" >
    <thead>
        <tr className = "bg-bg-section text-left" >
        {['Status', 'Name', 'Guests', 'Email', 'Phone', 'Dietary', 'Message', 'Date'
].
    map(h => (
        <th key = {h}
    className = "px-3 py-2 font-medium text-text-secondary border-b border-border" >
        {h}
        < /th>
))
}
    </tr>
    < /thead>
    < tbody >
    {rsvps?.map(r => (
        <tr key = {r.id}
    className = "border-b border-border hover:bg-bg-section" >
    <td className = "px-3 py-2" > {r.attending ? '✅' : '❌'} < /td>
        < td
    className = "px-3 py-2 font-medium" > {r.name} < /td>
        < td
    className = "px-3 py-2" > {r.guest_count} < /td>
        < td
    className = "px-3 py-2 text-text-muted" > {r.email ?? '—'} < /td>
        < td
    className = "px-3 py-2 text-text-muted" > {r.phone ?? '—'} < /td>
        < td
    className = "px-3 py-2 text-text-muted" > {r.dietary ?? '—'} < /td>
        < td
    className = "px-3 py-2 text-text-muted max-w-xs truncate" > {r.message ?? '—'} < /td>
        < td
    className = "px-3 py-2 text-text-muted" >
        {new Date(r.created_at).toLocaleDateString('en-US')}
        < /td>
        < /tr>
))
}
    </tbody>
    < /table>
    < /div>

    {/* Photo grid */
    }
    <h2 className = "font-display text-h2 mb-4" > Photos({photos?.length ?? 0
})
    </h2>
    < div
    className = "grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-8 gap-2 mb-12" >
        {photos?.map(p => (
            <a
                key = {p.id}
    href = {p.public_url}
    target = "_blank"
    rel = "noopener noreferrer"
    className = "block"
    title = {p.uploader_name ?? ''}
    >
    <img
        src = {p.public_url}
    className = "w-full h-20 object-cover rounded hover:opacity-90 transition-opacity"
    loading = "lazy"
        / >
        </a>
))
}
    </div>
    < /div>
)
}
```

### Download all photos locally

```bash
# Install rclone: https://rclone.org/install/
rclone config
# Choose: Cloudflare R2 → enter Account ID, Access Key, Secret Key

# Download everything with one command
rclone sync r2:wedding-photos/photos ./wedding-photos-backup
```

---

## Phase 9 — Polish and deploy

### Metadata and SEO

```typescript
// app/[locale]/layout.tsx
export async function generateMetadata({params: {locale}}: { params: { locale: string } }) {
    const messages = await getMessages()
    return {
        title: messages.meta.title,
        description: messages.meta.description,
        openGraph: {
            title: messages.meta.title,
            images: [{url: '/og-image.jpg', width: 1200, height: 630}],
        },
    }
}
```

### Performance optimisation

```typescript
// Hero photo — loads first
<Image src = "/hero.jpg"
priority
fetchPriority = "high"
sizes = "100vw"
fill / >

// All other photos — lazy
<img loading = "lazy"
decoding = "async" / >

// Fonts — display: swap so they don't block rendering
const font = SomeFont({display: 'swap'})
```

### Navigation with smooth scroll

```typescript
// components/ui/Navigation.tsx
'use client'
import {useTranslations} from 'next-intl'
import {NAV_ITEMS} from '@/lib/config/nav'
import {LanguageSwitcher} from './LanguageSwitcher'

export function Navigation() {
    const t = useTranslations('nav')

    function scrollTo(href: string) {
        document.querySelector(href)?.scrollIntoView({behavior: 'smooth'})
    }

    return (
        <nav className = "fixed top-0 left-0 right-0 z-50
    bg - bg - card / 80
    backdrop - blur - md
    border - b
    border - border
    ">
    < div
    className = "max-w-[var(--max-width)] mx-auto px-4 h-16
    flex
    items - center
    justify - between
    ">
    < span
    className = "font-accent text-xl text-primary" >
        Name & Name
        < /span>

        < div
    className = "hidden md:flex items-center gap-6" >
        {
            NAV_ITEMS.map(item => (
                <button
                    key = {item.key}
            onClick = {()
=>
    scrollTo(item.href)
}
    className = "text-small text-text-secondary hover:text-text-primary
    transition - colors
    duration - fast
    "
    >
    {t(item.key
)
}
    </button>
))
}
    </div>

    < LanguageSwitcher / >
    </div>
    < /nav>
)
}
```

### Domain

```bash
# In Vercel Dashboard:
# Settings → Domains → Add → yourname.com

# DNS at your registrar:
# A     @    76.76.21.21
# CNAME www  cname.vercel-dns.com
```

---

## 18. Rule for everything new

When adding something new — follow this order (**FSD under `src/`**; `lib/` and `components/` are transitional — see *
*§3**).

```
1. DATA / CONFIG → src/entities/<slice>/ (model or config) + public export from index.ts
   During migration: optional thin re-export from lib/config/*.ts if external callers still use @/lib/config
   Example: new schedule field → migration + `@entities/wedding-schedule` + `@features/wedding-schedule` + admin/guest UI

2. STRINGS → messages/ru.json + messages/en.json
   Both files at the same time, always.

3. NEW SECTION → src/widgets/<kebab-name>-section/ (see §3.2 widget naming)
   + export from widget index.ts (PascalCase component)
   + wire in app/[locale]/page.tsx
   + nav: @entities/site-nav (or lib/config/nav.ts re-export until fully switched)

4. NEW UI PRIMITIVE → src/shared/ui/
   Only CSS tokens: className="text-primary bg-bg-card"
   Never: style={{ color: '#C9A69A' }}

5. NEW USE CASE (API + validation + side effects) → src/features/<name>/
   app/api/*/route.ts stays thin: parse request, call feature, map errors to HTTP

6. NEW FORM FIELD (RSVP example):
   a. Field definition in @entities/rsvp (re-export via lib/config/rsvp.ts during transition)
   b. Strings in messages/ru.json and messages/en.json
   c. Zod + submit path in @features/rsvp-submit (not duplicated in the route)
   d. Column in Supabase if storage is needed

NEVER hardcode:
  ✗ Colours: style={{ color: '#C9A69A' }}
  ✗ Strings: <p>Thank you!</p>
  ✗ Data: const items = [{ title: 'Ceremony' }]
```

---

## 19. Pre-wedding checklist

```
Functionality
  [ ] RSVP form submits — email arrives
  [ ] Photo upload from iPhone Safari (iOS — the most finicky browser)
  [ ] Photo upload from Android Chrome
  [ ] Deep links: Venmo, Cash App, PayPal open in their apps
  [ ] Zelle: tap copies number to clipboard
  [ ] Countdown shows the correct remaining time
  [ ] Wishes save and display correctly
  [ ] Admin panel: login at /admin/login, session cookie, site settings save
  [ ] Cron jobs visible in Vercel Dashboard → Settings → Cron Jobs
  [ ] RU/EN switcher works and preserves scroll position

Performance
  [ ] Lighthouse Score > 90 on mobile
  [ ] First screen loads < 2 sec on 4G

Content
  [ ] All names, date, venue — correct
  [ ] Both locales (RU + EN) — all strings filled in
  [ ] Schedule is up to date
  [ ] Addresses in schedule.ts → Google Maps links work
  [ ] Payment credentials (Venmo/Cash App/PayPal usernames) are real

Infrastructure
  [ ] Domain connected to Vercel
  [ ] SSL certificate active (Vercel handles this automatically)
  [ ] R2 Custom Domain configured (media.yourdomain.com)
  [ ] RESEND_API_KEY domain verified
  [ ] Admin password in DB (`admin_site_credential` via `npm run admin:set-password`), ADMIN_SESSION_SECRET, optional ADMIN_SECRET for API scripts
  [ ] All env variables added in Vercel Dashboard
```

---

## Development order — summary

```
Day 0    Phase 0   Accounts: Vercel, Supabase, R2, Resend. All keys in .env
Day 1    Phase 1   npx create-next-app, dependencies, first deploy to Vercel
Day 2    Phase 2   globals.css (theme), all UI primitives
Day 2–3  Phase 2   i18n: next-intl, messages/ru.json, messages/en.json, LanguageSwitcher
Day 3    Phase 3   Hero + Countdown, Navigation
Day 4    Phase 3   Schedule, DressCode, Welcome, OurStory (MDX)
Day 5    Phase 4   RSVP: DynamicForm + API route + email
Day 6–7  Phase 5   Photo gallery: R2, presign, PhotoUploader, Gallery with infinite scroll
Day 8    Phase 6   Wishes: form + feed
Day 9    Phase 7   Donate: DeepLinkButton, payments.ts config
Day 10   Phase 8   Admin panel
Day 11   Phase 9   Domain, SEO, mobile QA, checklist
```