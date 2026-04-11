import type {Metadata} from 'next'
import {Cormorant_Garamond, Great_Vibes, Roboto} from 'next/font/google'
import {Analytics} from '@vercel/analytics/next'
import {getLocale} from 'next-intl/server'
import {AppToaster} from '@shared/ui'
import './globals.css'
import './hero-mesh-gradient.css'
import React from "react";

const fontDisplay = Cormorant_Garamond({
    subsets: ['latin', 'cyrillic'],
    weight: ['300', '400', '600'],
    variable: '--font-display',
    display: 'swap',
})

const fontHeader = Cormorant_Garamond({
    subsets: ['latin', 'cyrillic'],
    weight: ['400'],
    variable: '--font-header',
    display: 'swap',
})

const fontBody = Roboto({
    subsets: ['latin', 'latin-ext', 'cyrillic'],
    weight: ['300', '400', '700'],
    variable: '--font-body',
    display: 'swap',
})

const fontAccent = Great_Vibes({
    subsets: ['latin', 'cyrillic'],
    weight: ['400'],
    variable: '--font-accent',
    display: 'swap',
})

const FAVICON_V = '20260410'

export const metadata: Metadata = {
    title: 'Yurii & Mariia Wedding',
    description: 'Wedding website',
    icons: {
        icon: [
            {
                url: `/favicon/favicon-96x96.png?v=${FAVICON_V}`,
                sizes: '96x96',
                type: 'image/png',
            },
            {
                url: `/favicon/favicon.svg?v=${FAVICON_V}`,
                type: 'image/svg+xml',
            },
        ],
        shortcut: `/favicon/favicon.ico?v=${FAVICON_V}`,
        apple: [
            {
                url: `/favicon/apple-touch-icon.png?v=${FAVICON_V}`,
                sizes: '180x180',
                type: 'image/png',
            },
        ],
    },
    manifest: `/favicon/site.webmanifest?v=${FAVICON_V}`,
    appleWebApp: {
        title: 'Yurii & Mariia Wedding',
    },
}

export default async function RootLayout(
    {
        children,
    }: Readonly<{ children: React.ReactNode }>
) {
    const locale = await getLocale()

    return (
        <html
            lang={locale}
            className={`${fontDisplay.variable} ${fontHeader.variable} ${fontBody.variable} ${fontAccent.variable}`}
        >
        <body className="min-h-dvh antialiased">
        {children}
        <AppToaster/>
        <Analytics/>
        </body>
        </html>
    )
}
