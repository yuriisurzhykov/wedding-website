# Entity: dresscode

Static palette data for the dress code section: allowed and discouraged colors with display hex values.

## Public API

- `PALETTE` — list of `PaletteColor` (`key`, `hex`, `allowed`).
- `PaletteColor` — type for one swatch row.

## When to use

- **Widgets:** render swatches and legend from `PALETTE` only; do not duplicate hex lists in UI.

## Extending

Add a `PaletteColor` entry (or adjust `allowed`) and add matching i18n keys if the label is keyed by `key`.
