import type {Metadata} from 'next'
import {Cormorant_Garamond, Great_Vibes, Lato} from 'next/font/google'
import {Analytics} from '@vercel/analytics/next'
import {getLocale} from 'next-intl/server'
import './globals.css'

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

export const metadata: Metadata = {
    title: 'Wedding',
    description: 'Wedding website',
}

export default async function RootLayout({
                                             children,
                                         }: Readonly<{ children: React.ReactNode }>) {
    const locale = await getLocale()

    return (
        <html
            lang={locale}
            className={`${fontDisplay.variable} ${fontBody.variable} ${fontAccent.variable}`}
        >
        <body className="min-h-dvh antialiased">
        {children}
        <Analytics/>
        </body>
        </html>
    )
}
