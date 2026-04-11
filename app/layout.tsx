import type {Metadata} from 'next'
import {Cormorant_Garamond, Great_Vibes, Roboto} from 'next/font/google'
import {Analytics} from '@vercel/analytics/next'
import {getLocale} from 'next-intl/server'
import {getPublicSiteUrl} from '@shared/lib/get-public-site-url'
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
const SITE_TITLE = 'Yurii & Mariia Wedding'
const SITE_DESCRIPTION = 'Wedding website'

export async function generateMetadata(): Promise<Metadata> {
    let manifest = `/favicon/site.webmanifest?v=${FAVICON_V}`;
    let appleWebApp = {
        title: SITE_TITLE,
    };
    let faviconIcons = {
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
    };
    const publicBase = getPublicSiteUrl()
    if (!publicBase) {

        return {
            title: SITE_TITLE,
            description: SITE_DESCRIPTION,
            icons: faviconIcons,
            manifest: manifest,
            appleWebApp: appleWebApp,
        }
    }
    const metadataBase = new URL(publicBase)
    return {
        metadataBase,
        title: SITE_TITLE,
        description: SITE_DESCRIPTION,
        icons: faviconIcons,
        manifest: manifest,
        appleWebApp: appleWebApp,
        openGraph: {
            title: SITE_TITLE,
            description: SITE_DESCRIPTION,
            url: new URL('/', metadataBase),
            siteName: SITE_TITLE,
            type: 'website',
            images: [
                {
                    url: '/og/wedding-preview.png',
                    alt: SITE_TITLE,
                },
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title: SITE_TITLE,
            description: SITE_DESCRIPTION,
            images: ['/og/wedding-preview.png'],
        },
    }
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
