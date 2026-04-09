import type {MetadataRoute} from 'next'

import {getPublicSiteUrl} from '@shared/lib/get-public-site-url'
import {pathForLocale, toAbsoluteUrl} from '@shared/lib/i18n/locale-path'

import {routing} from '@/i18n/routing'

const PUBLIC_PATHS = ['', '/gallery', '/wishes'] as const

export default function sitemap(): MetadataRoute.Sitemap {
    const base = getPublicSiteUrl()
    if (!base) {
        return []
    }

    const entries: MetadataRoute.Sitemap = []

    for (const path of PUBLIC_PATHS) {
        const enPath = pathForLocale('en', path)
        const ruPath = pathForLocale('ru', path)
        const enUrl = toAbsoluteUrl(base, enPath)
        const ruUrl = toAbsoluteUrl(base, ruPath)
        const defaultPath = pathForLocale(routing.defaultLocale, path)
        const defaultUrl = toAbsoluteUrl(base, defaultPath)

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
