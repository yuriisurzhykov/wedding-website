import type {MetadataRoute} from 'next'

import {getPublicSiteUrl} from '@shared/lib/get-public-site-url'

import {routing} from '@/i18n/routing'

const PUBLIC_PATHS = ['', '/gallery', '/wishes'] as const

function pathForLocale(locale: string, path: string): string {
    const suffix = path === '' ? '' : path
    if (
        locale === routing.defaultLocale &&
        routing.localePrefix === 'as-needed'
    ) {
        return suffix === '' ? '' : suffix
    }
    return `/${locale}${suffix}`
}

function absoluteUrl(base: string, pathname: string): string {
    const normalized = pathname.replace(/\/+/g, '/')
    if (normalized === '' || normalized === '/') {
        return `${base}/`
    }
    return `${base.replace(/\/+$/, '')}${normalized.startsWith('/') ? '' : '/'}${normalized}`
}

export default function sitemap(): MetadataRoute.Sitemap {
    const base = getPublicSiteUrl()
    if (!base) {
        return []
    }

    const entries: MetadataRoute.Sitemap = []

    for (const path of PUBLIC_PATHS) {
        const enPath = pathForLocale('en', path)
        const ruPath = pathForLocale('ru', path)
        const enUrl = absoluteUrl(base, enPath)
        const ruUrl = absoluteUrl(base, ruPath)
        const defaultPath = pathForLocale(routing.defaultLocale, path)
        const defaultUrl = absoluteUrl(base, defaultPath)

        entries.push({
            url: defaultUrl,
            lastModified: new Date(),
            changeFrequency: path === '' ? 'weekly' : 'daily',
            priority: path === '' ? 1 : 0.8,
            alternates: {
                languages: {
                    'x-default': defaultUrl,
                    en: enUrl,
                    ru: ruUrl,
                },
            },
        })
    }

    return entries
}
