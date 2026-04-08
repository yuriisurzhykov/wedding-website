# Widget: `hero-section`

Home page **hero**: names, ceremony date line, venue link, and countdown to the ceremony.

## Why this slice exists

Keeps the marketing route free of section layout; depends on `@shared/lib/wedding-calendar` for dates and `@shared/ui` for `Countdown`.

## Public API

| Export        | Role                                      |
|---------------|-------------------------------------------|
| `HeroSection` | Async server component for the full hero. |

## Data flow

`getLocale` / `getTranslations('hero')`, `formatHeroWeddingLine`, `getWeddingCeremonyDate` from `@shared/lib/wedding-calendar`, and `VENUE.mapsUrl` from `@entities/wedding-venue`.
