# Widget: `hero-section`

Home page **hero**: names, ceremony date line, venue link, and countdown to the ceremony.

## Why this slice exists

Keeps the marketing route free of section layout; depends on `@shared/lib/wedding-calendar` for dates and `@shared/ui`
for `Countdown`.

## Approach

- **Decor:** `HeroBotanicalBackdrop` (internal) renders stationery-style SVG corners above the mesh gradient, using theme
  colors (`text-secondary`, `text-primary`, `text-accent`) and `aria-hidden`. No extra image requests (LCP-friendly).
- **Stacking:** the class `hero-botanical-decor` is excluded from `.hero-mesh > * { position: relative }` in
  [`app/hero-mesh-gradient.css`](../../../app/hero-mesh-gradient.css) so the layer stays `position: absolute` between
  `::before` and the hero copy.

## Public API

| Export        | Role                                      |
|---------------|-------------------------------------------|
| `HeroSection` | Async server component for the full hero. |

## Configuration

- To tune corner weight, adjust opacity on the SVG groups in `ui/HeroBotanicalBackdrop.tsx` or the wrapper
  `opacity-[0.42]` on the corner containers. Prefer theme tokens over raw hex for new accents.

## Data flow

`getLocale` / `getTranslations('hero')`, `formatHeroWeddingLine`, `getWeddingCeremonyDate` from
`@shared/lib/wedding-calendar`, and `VENUE.mapsUrl` from `@entities/wedding-venue`.
