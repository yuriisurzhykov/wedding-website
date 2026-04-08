import type {MetadataRoute} from 'next'

import {getPublicSiteUrl} from '@shared/lib/get-public-site-url'

export default function robots(): MetadataRoute.Robots {
    const base = getPublicSiteUrl()
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/api/', '/ui'],
        },
        sitemap: base ? `${base.replace(/\/+$/, '')}/sitemap.xml` : undefined,
    }
}
