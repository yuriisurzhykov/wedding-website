---
name: Multi-page nav overview
overview: Многостраничное приложение с превью на главной; расширяемый реестр навигации; галерея/пожелания со стратегиями и пагинацией (offset + «Загрузить ещё»); модули как plug-in units с README; кастомизация через пропсы/опции; константы слайса не торчат наружу (только публичный контракт в index.ts).
todos:
  - id: nav-registry
    content: "Единый реестр экранов/навигации: одна декларация → меню + типизированные пути; чеклист «новый экран за минуты» в README site-nav"
    status: completed
  - id: docs-standards
    content: Шаблон README для slice/widget/feature (подход, задачи, использование, расширение, настройка); код self-documented, без построчных комментариев
    status: completed
  - id: fsd-constants
    content: Лимиты и defaults только во внутренних файлах slice; index.ts без реэкспорта констант; вызывающий код — variant/presentation, не импорт констант
    status: completed
  - id: pagination-design
    content: Реализовать offset+limit и hasMore; SSR первая порция; UI «Загрузить ещё» на /gallery и /wishes; GET wishes list или единый паттерн в README
    status: completed
  - id: features-count-api
    content: countWishes/countGalleryPhotos; GET /api/gallery/photos с limit/offset/hasMore (+ зеркало для wishes)
    status: completed
  - id: gallery-wishes-strategy
    content: "Один виджет на фичу: presentation preview|full; внутренние константы; отдельные файлы; className/slots/options"
    status: completed
  - id: routes-layout
    content: Страницы gallery/wishes; SiteNavigation + main в locale layout; home page только секции
    status: completed
  - id: nav-entity-ui
    content: SiteNavigation читает реестр; section vs route; Link + scroll/push; i18n ru+en
    status: completed
  - id: polish
    content: WishesSectionForm router из i18n/navigation; metadata; sitemap при наличии
    status: completed
isProject: true
---

# Многостраничная структура, навигация и модульность

Источник правды в git для этой дорожной карты — этот файл (рядом с другими планами в `.cursor/plans/`).

## Текущее состояние

- Главная: все секции подряд в [`app/[locale]/page.tsx`](app/[locale]/page.tsx); шапка только на этой странице.
- Навигация: [`src/entities/site-nav/model/nav-items.ts`](src/entities/site-nav/model/nav-items.ts) — только `#fragment`; [`SiteNavigation`](src/widgets/site-navigation/ui/SiteNavigation.tsx) везде делает `scrollIntoView`.
- Галерея: [`GallerySection`](src/widgets/gallery-section/ui/GallerySection.tsx) → `listGalleryPhotos(48)` + [`GalleryPhotosClient`](src/widgets/gallery-section/ui/GalleryPhotosClient.tsx) тянет [`GET /api/gallery/photos`](app/api/gallery/photos/route.ts) без лимита (всегда 48 на сервере).
- Пожелания: [`WishesSection`](src/widgets/wishes-section/ui/WishesSection.tsx) → `listWishes(50)`; после отправки формы — `router.refresh()` из `next/navigation` ([`WishesSectionForm`](src/widgets/wishes-section/ui/WishesSectionForm.tsx)).

## Целевая модель (продукт)

- **Главная** — обзор: статические секции; галерея — **Uploader + 10–15 последних** + CTA на полную галерею; пожелания — **форма + 2–3 последних** + CTA «все (N)».
- **Страницы** `/{locale?}/gallery` и `/{locale?}/wishes`: список с **пагинацией** (offset + «Загрузить ещё», см. п. C) + тот же uploader/форма.
- **Меню**: галерея и пожелания → **маршруты**; остальное → **якоря главной** (с главной плавный скролл; с внутренней страницы — переход на главную с hash).

---

## Архитектурные принципы (ваши уточнения)

### A. Расширяемая навигация и «новый экран за пару минут»

- Ввести **единый реестр приложения** (конфиг в `@entities/site-nav` и/или тонкий re-export в `lib/config` по [ARCHITECTURE.md](ARCHITECTURE.md) §3.3): для каждого пункта задаются `kind` (`section` | `route`), `navKey` (ключ i18n), при необходимости `path` (литерал маршрута, согласованный с `app/[locale]`), при `section` — `hash` / `sectionId`.
- **Один источник правды**: `SiteNavigation` и любые будущие «карточки обзора» на главной читают тот же список (или производный view), чтобы не дублировать знание «какие фичи есть».
- В README реестра — **короткий чеклист**: добавить запись в реестр → ключи в `messages/ru.json` + `messages/en.json` → файл страницы в `app/[locale]/...` → при секции — `id` на главной → при необходимости виджет в `page.tsx`. Цель: предсказуемый конструктор без охоты по файлам.

### B. Документация модулей (не построчные комментарии)

- Для **каждого slice / widget / feature**, который меняется в рамках работы, обновить или добавить **README.md** по единому шаблону:
  - **Зачем модуль** и какие задачи решает.
  - **Подход** (почему RSC здесь, почему клиентский остров там, откуда данные).
  - **Публичный контракт** (`index.ts`): что импортировать снаружи.
  - **Как подключить** на странице (минимальный пример).
  - **Как расширить** (новое поле, новый режим, новая страница).
  - **Настройка и кастомизация** (какие пропсы / options / className).
  - **Ошибки и граничные случаи** (если есть).
- **Код** держать самодокументируемым (имена, разбиение файлов, узкие функции); **не** дублировать очевидное построчными комментариями. Согласовать формулировки с [docs/CODING_STANDARDS.md](docs/CODING_STANDARDS.md) и правилами FSD в репо.

### C. Пагинация полной галереи и пожеланий (зафиксировано)

- **Модель данных**: **offset + limit** (`offset`, `limit` или эквивалент `page` × `pageSize` в API с явной формулой в README feature).
- **UI**: **«Загрузить ещё»** (подгрузка следующей порции на клиенте; при желании позже добавить префетч или скелетоны — без смены модели).
- **API**: для галереи — расширить `GET /api/gallery/photos` параметрами `offset`/`limit` (или `page`/`pageSize`), ответ включать **`hasMore`** (и при необходимости `total` для доступности/текста кнопки). Для пожеланий — либо тот же контракт в новом **публичном** `GET` (если лента на полной странице остаётся клиентской), либо только server `listWishes` для первой порции + тот же GET для следующих — выбрать один путь и описать в README (без дублирования бизнес-логики в route).
- **SSR**: первая порция с сервера на `/gallery` и `/wishes`, последующие — `fetch` с теми же query-параметрами; кнопка «Загрузить ещё» disabled, пока `hasMore === false`.

### D. Один повод к изменению, отдельные файлы, plug-in unit

- Разбивать крупные виджеты на **узкие файлы**: одна ответственность (например: список миниатюр, lightbox, панель пагинации, форма пожеланий, лента) — один основной повод менять файл.
- **Публичный вход** слайса — только через `index.ts`; внутренности не импортировать снаружи слоя.
- Каждый такой **модуль = plug-in unit**: в README явно указано, куда его вставляют (главная vs `/gallery`), какие зависимости (feature X, API Y).

### E. Кастомизация UI и настройка не-UI функций

- **UI**: везде, где уместно, предусмотреть `className`, при необходимости слоты/композиция (children, render props только если проще нельзя — предпочтение пропсам и маленьким подкомпонентам в том же slice).
- **Data / use-case функции**: опциональный объект **options** (лимит, курсор, сортировка), расширяемый без ломки сигнатуры; документировать в README feature-слоя.

### F. Варианты поведения через стратегию, а не копипасту

- Не плодить `GallerySectionHome` / `GallerySectionFull`. Один составной виджет (или композиция из мелких частей одного slice) с явным **режимом или стратегией**: например `presentation: 'preview' | 'full'`; либо вынесенный тип/объект конфигурации (`getGallerySectionConfig('preview')`), если так читаемее — но **без экспорта внутренних констант** (см. G).
- Новый сценарий = **новое значение стратегии + опционально новый маленький подкомпонент**, а не форк всего виджета.

### G. Константы и публичный API слоя (FSD)

- Любые **числовые лимиты**, дефолтные размеры страницы, внутренние литералы — только во **внутренних** файлах слайса (например `config.ts` / `lib/internal-defaults.ts` **внутри** `gallery-section`, `wish-list` и т.д.).
- **`index.ts` слайса не реэкспортирует константы**; снаружи слоя никто не пишет `import { HOME_GALLERY_PREVIEW_LIMIT } from '@widgets/gallery-section'`.
- Потребитель (страница в `app/`, другой виджет) выражает намерение через **публичный контракт**: проп вроде `presentation="preview"` | `"full"`, опциональные override-пропсы только если продуктово нужно явно пробить число с уровня страницы (исключение, не норма).
- Общие **данные** дня свадьбы (не «настройки виджета») — по [ARCHITECTURE.md](ARCHITECTURE.md) в `@entities` или `lib/config`; это не отменяет правило «константы реализации виджета остаются внутри виджета».

---

## Реализация по слоям (связка с принципами выше)

### 1. Данные и API

- `countWishes()` (+ по желанию `countGalleryPhotos()`) в соответствующих features; лимиты запросов и дефолты **внутри feature**, без экспорта наружу, если только не нужен общий доменный конфиг в entity.
- `listGalleryPhotos` / `listWishes`: **options** `{ limit, offset }` и возврат списка; для «есть ещё» — либо запрос `limit+1` и обрезка на сервере, либо отдельный count — зафиксировать один способ в README feature (предпочтительно предсказуемый контракт с `hasMore`).
- `GET /api/gallery/photos`: `limit`, `offset`, ответ `{ photos, hasMore }` (+ опционально `total`); Zod в route; публичный **GET для wishes** — зеркально, если лента на `/wishes` подгружается с клиента.

### 2. Виджеты галереи и пожеланий

- Превью и размер страницы: **внутренние** константы внутри slice, маппинг `presentation` → эти значения — внутри виджета/feature.
- **Стратегия/режим** вместо дублирования секций; отдельные файлы для сетки, lightbox, CTA, кнопки «Загрузить ещё».
- Клиентский refetch учитывает режим (превью vs полная страница).

### 3. Маршруты и layout

- [`app/[locale]/gallery/page.tsx`](app/[locale]/gallery/page.tsx), [`app/[locale]/wishes/page.tsx`](app/[locale]/wishes/page.tsx) с `generateMetadata`.
- [`SiteNavigation`](src/widgets/site-navigation/ui/SiteNavigation.tsx) + обёртка `main` в [`app/[locale]/layout.tsx`](app/[locale]/layout.tsx).

### 4. Навигация

- Реестр: дискриминированный union `section` | `route` + **единая таблица порядка** для меню.
- `SiteNavigation`: `Link` для маршрутов; для секций — home + smooth scroll vs переход на `/` с hash.
- i18n: все новые строки в `messages/ru.json` и `messages/en.json` синхронно.

### 5. Полировка

- `WishesSectionForm`: `useRouter` из `@/i18n/navigation`.
- Sitemap/robots при наличии генерации.

---

## Риски и решения

- **Якорь превью галереи на главной**: зафиксировать `id` и поведение старых ссылок в README site-nav.
- **Пагинация и real-time**: при появлении подписок/реалтайма согласовать инвалидацию offset (отложить или упростить UI).

## Вне текущего скоупа

- Отдельные страницы RSVP/donate, breadcrumbs, unless добавлены в реестр позже.
