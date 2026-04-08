export interface PaletteColor {
    key: string
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
