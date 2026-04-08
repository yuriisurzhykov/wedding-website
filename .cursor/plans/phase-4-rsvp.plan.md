---
name: Phase 4 RSVP
overview: RSVP по ARCHITECTURE.md в стиле FSD — API, Resend, виджет секции, env, README/JSDoc.
todos:
  - id: fsd-scaffold
    content: Ввести корень FSD (например src/), алиасы tsconfig, правила импорта между слоями
    status: completed
  - id: shared-resend
    content: "shared: server-only env + фабрика Resend/from (согласовать с app/api/health/resend)"
    status: completed
  - id: entity-rsvp
    content: "entities/rsvp: типы, map form→row, без публичных магических констант"
    status: completed
  - id: feature-submit
    content: "features/rsvp-submit: Zod, submitRsvp, notify admin, README + JSDoc контрактов"
    status: completed
  - id: api-route-thin
    content: app/api/rsvp/route.ts — только HTTP → submitRsvp
    status: completed
  - id: widget-section
    content: "widgets/rsvp-section: RsvpSection, subtitle + deadline, fetch, README"
    status: completed
  - id: page-wire
    content: "app/[locale]/page.tsx — заменить заглушку #rsvp на виджет"
    status: completed
  - id: env-example
    content: Обновить .env.example (переменные RSVP + Resend, без секретов)
    status: pending
isProject: false
---

# Phase 4 — RSVP (FSD, модульность, env, документация)

## TODO (чеклист реализации)

- [ ] **fsd-scaffold** — корень слоёв + `tsconfig` paths (`@shared`, `@entities`, `@features`, `@widgets`).
- [ ] **shared-resend** — общий server-only слой Resend/env, выровнять с `app/api/health/resend`.
- [ ] **entity-rsvp** — типы и маппинг форма → строка БД, инкапсуляция констант.
- [ ] **feature-submit** — валидация (Zod), insert в Supabase, уведомление админу; README + JSDoc.
- [ ] **api-route-thin** — `POST /api/rsvp` только проксирует в `submitRsvp` и маппит ошибки в HTTP.
- [ ] **widget-section** — `RsvpSection`: Section, header, DynamicForm, дедлайн в subtitle, `fetch`.
- [ ] **page-wire** — подключить виджет на главной, убрать `aria-hidden` заглушку `#rsvp`.
- [ ] **env-example** — задокументировать нужные переменные в `.env.example`.

## Цели (дополнение к ARCHITECTURE.md §4)

- Структура в духе **Feature-Sliced Design**: явные слои, однонаправленные импорты (shared → entities → features → widgets → app), без «торчащих наружу» внутренних констант.
- **Один файл — одна причина меняться** (схема валидации, маппинг в строку БД, HTML письма, HTTP-адаптер — раздельно).
- **Конфигурация из `process.env`** на границе сервера: не экспортировать сырые ключи/адреса из модулей; читать env в server-only функциях вроде `getRsvpMailerConfig()` / `assertRsvpApiEnv()` и возвращать типизированный объект (или падать с понятной ошибкой).
- **Документация**: в каждом слайсе — краткий `README.md` (или один `docs/rsvp-module.md`, если не хотите много файлов) с фокусом на **зачем** устроено именно так, **публичный контракт**, **ошибки и как их обрабатывать выше по стеку**, **как безопасно расширять** (новое поле = какие файлы трогать). Публичные экспорты — JSDoc: как вызывать, что бросает/возвращает, инварианты.

## Стратегия внедрения FSD в текущий репозиторий

Полный перенос `app/` в `src/app` и разбор всего `components/` — отдельный крупный рефакторинг. Рекомендация для этой задачи:

1. **Ввести корень слайсов** — например `src/` (или `fsd/`, если не хотите трогать привычный `src`): только новые слои RSVP + минимальный `shared` для того, что выделится из RSVP (см. ниже).
2. **Тонкий Next-слой**: `app/api/rsvp/route.ts` остаётся точкой входа HTTP и только вызывает функцию из `features/rsvp-submit` (без бизнес-логики в файле роута).
3. **Существующие** `components/ui/DynamicForm`, `lib/config/rsvp.ts`, `lib/wedding-calendar` **временно** импортировать из виджета; в плане миграции (отдельный этап) перенести общий UI в `shared/ui`, конфиг формы — в `entities/rsvp` или `shared/config`, чтобы не дублировать правила импорта FSD.

Импорты: настроить алиасы в `tsconfig.json` (например `@shared/*`, `@entities/*`, `@features/*`, `@widgets/*`) по [документации FSD](https://feature-sliced.design/docs/guides/tech/with-nextjs).

## Предлагаемая карта файлов (RSVP)

Ниже — ориентир; имена можно слегка сдвинуть, главное — разделение ответственности.

| Слой | Назначение | Примеры файлов |
|------|------------|----------------|
| **entities/rsvp** | Предметная модель RSVP: типы строки БД, тип «вход с формы», инварианты (например guest_count при `attending: false`). Без HTTP и без Resend. | `model/types.ts`, `model/map-form-to-row.ts` (не экспортировать наружу внутренние константы — только функции) |
| **features/rsvp-submit** | Сценарий «принять данные → записать в БД → инициировать уведомление». Server-only. | `api/submit-rsvp.ts` (основной публичный use-case), `lib/validate-payload.ts` (Zod + refine для guestCount при attending), `index.ts` — узкий public API |
| **features/rsvp-submit** (email) | Уведомление админу. | `lib/notify-admin.ts` вызывает общий почтовый слой (см. shared) |
| **shared/lib/email** (или **shared/api/resend**) | Общий Resend: создание клиента, `from`/`to` из env, единая политика с [`app/api/health/resend/route.ts`](app/api/health/resend/route.ts) (`RESEND_API_KEY`, `ADMIN_EMAIL`, `RESEND_FROM_EMAIL`). | `createResendClient.ts`, `getTransactionalFromAddress.ts` — **без** экспорта строк-по умолчанию наружу, если хотите полную инкапсуляцию (дефолты только внутри функции или только через env с явным fallback в одном месте с комментарием «почему») |
| **widgets/rsvp-section** | Композиция секции страницы: `Section`, `SectionHeader`, `DynamicForm`, `fetch`, дедлайн в subtitle. | `ui/RsvpSection.tsx` — один публичный компонент для страницы |
| **app** | `app/api/rsvp/route.ts` — парсинг Request, вызов `submitRsvp`, маппинг ошибок в HTTP. | ~15–25 строк |

**DynamicForm сегодня смешивает** общую механику полей и сценарий RSVP (кнопки attending). На будущее в плане отметить: вынести «оболочку RSVP» (две кнопки + submitting) в `widgets/rsvp-section/ui/RsvpAttendanceStep.tsx`, а `DynamicForm` оставить чисто полевым в `shared/ui` — отдельная задача, не блокирует Phase 4.

## Env (всё с сервера)

Использовать уже принятые имена:

- `SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — как в [`lib/supabase.ts`](lib/supabase.ts).
- `RESEND_API_KEY`, `ADMIN_EMAIL`, `RESEND_FROM_EMAIL` — как в health-resend.

Не экспортировать из модулей глобальные `const FROM = '...'` для продакшена; при необходимости fallback для dev — один внутренний путь в `getTransactionalFromAddress()` с комментарием и ссылкой на Resend onboarding.

## Контракты и ошибки (документировать явно)

- **HTTP POST `/api/rsvp`**: тело JSON; ответ `{ ok: true }` или `{ error: ... }` с кодами 400 / 500. В README feature: таблица «ситуация → статус → тело → что делает клиент».
- **`submitRsvp` (feature)**: либо `Result` тип, либо выбрасываемые доменные ошибки + перехват в route — но **один** стиль на весь feature; в JSDoc перечислить.
- **Письмо**: не блокировать ответ гостю; ошибки логировать (как в ARCHITECTURE §4.1). В README объяснить **почему** fire-and-forget.

## Документация (содержание, не «что делает каждая строка»)

Для `entities/rsvp/README.md` + `features/rsvp-submit/README.md` + `widgets/rsvp-section/README.md` (или одного сводного файла):

- Зачем слайс существует и какие сценарии он покрывает.
- Какие модули считаются **публичным API** (реэкспорт из `index.ts`).
- Как добавить поле: порядок правок (конфиг полей i18n → Zod → map → письмо → типы).
- Ошибки и наблюдаемость (логи, что смотреть в Vercel / Supabase).

## Интеграция в страницу

- Заменить заглушку `#rsvp` в [`app/[locale]/page.tsx`](app/[locale]/page.tsx) на импорт виджета `@widgets/rsvp-section` (или финальный путь после настройки алиасов).
- Подзаголовок с дедлайном: `formatRsvpDeadlineLine` из [`lib/wedding-calendar`](lib/wedding-calendar/index.ts) + `useLocale()` / `t('subtitle', { deadline })`.

## Порядок реализации

Следуй чеклисту **TODO** выше — порядок строк совпадает с зависимостями (сначала каркас и shared, затем entity → feature → API → виджет → страница → env).

## Сознательно вне scope Phase 4

- Полная миграция всего сайта на FSD.
- Вынос DynamicForm на чистый shared без RSVP-специфики (отдельная задача).
