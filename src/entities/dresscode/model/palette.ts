export interface PaletteColor {
    key: string
    hex: string
    allowed: boolean
}

/**
 * Dress code swatches: `hex` values match `--color-wedding-*` in `app/globals.css`
 * (blush → accent-dusty-pink, sage → brand-500, champagne → neutral-200, umber → neutral-700).
 */
export const PALETTE: PaletteColor[] = Array.from(
    new Set<PaletteColor>([
        {key: 'dustyrose', hex: 'rgb(230,208,212)', allowed: true},
        {key: 'sage', hex: '#768363', allowed: true},
        {key: 'champagne', hex: '#dbd2c7', allowed: true},
        {key: 'umber', hex: '#59504a', allowed: true},
        {key: 'white', hex: '#FFFFFF', allowed: false},
        {key: 'blue', hex: '#7dafe3', allowed: false},
    ])
)