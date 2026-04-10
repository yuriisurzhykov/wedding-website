export interface PaletteColor {
    key: string
    hex: string
    allowed: boolean
}

/**
 * Swatches shown in the dress code section; `hex` matches site palette tokens in `app/globals.css`
 * (`--color-wedding-*`).
 */
export const PALETTE: PaletteColor[] = [
    {key: 'dustyrose', hex: '#d29e9e', allowed: true},
    {key: 'sage', hex: '#748469', allowed: true},
    {key: 'champagne', hex: '#ccb195', allowed: true},
    {key: 'umber', hex: '#74583e', allowed: true},
    {key: 'white', hex: '#FFFFFF', allowed: false},
    {key: 'black', hex: '#000000', allowed: false},
]
