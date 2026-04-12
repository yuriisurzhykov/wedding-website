export interface PaletteColor {
    key: string
    hex: string
    allowed: boolean
}

/**
 * Swatches shown in the dress code section; `hex` matches site palette tokens in `app/globals.css`
 * (`--color-wedding-*`).
 */
export const PALETTE: PaletteColor[] = Array.from(
    new Set<PaletteColor>([
        {key: 'dustyrose', hex: '#e4cdd1', allowed: true},
        {key: 'sage', hex: '#768462', allowed: true},
        {key: 'champagne', hex: '#dbd2c7', allowed: true},
        {key: 'umber', hex: '#59504a', allowed: true},
        {key: 'white', hex: '#FFFFFF', allowed: false},
        {key: 'black', hex: '#000000', allowed: false},
    ])
)