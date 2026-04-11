import {listPhotosForAdmin} from '@features/admin-gallery-delete'
import {getLocale, getTranslations} from 'next-intl/server'

import type {AdminGalleryPhotoRow} from '../model/types'

import {AdminGalleryDeletePanel} from './AdminGalleryDeletePanel'

export async function AdminGallerySection() {
    const t = await getTranslations('admin.gallery')
    const locale = await getLocale()
    const result = await listPhotosForAdmin({limit: 48, offset: 0})

    if (!result.ok) {
        return (
            <section className="rounded-lg border border-border bg-bg-card p-6 shadow-card">
                <h1 className="font-display text-h2 text-text-primary">
                    {t('title')}
                </h1>
                <p className="mt-4 text-body text-red-500" role="alert">
                    {t('loadError')}
                </p>
            </section>
        )
    }

    const dateFmt = new Intl.DateTimeFormat(locale, {
        dateStyle: 'medium',
        timeStyle: 'short',
    })

    const rows: AdminGalleryPhotoRow[] = result.photos.map((p) => ({
        ...p,
        uploadedAtLabel: dateFmt.format(new Date(p.uploadedAt)),
    }))

    return (
        <section className="rounded-lg border border-border bg-bg-card p-6 shadow-card">
            <h1 className="font-display text-h2 text-text-primary">{t('title')}</h1>
            <p className="mt-2 text-body text-text-secondary">{t('subtitle')}</p>

            {rows.length === 0 ? (
                <p className="mt-8 text-body text-text-secondary">{t('empty')}</p>
            ) : (
                <div className="mt-8">
                    <AdminGalleryDeletePanel
                        photos={rows}
                        hasMore={result.hasMore}
                    />
                </div>
            )}
        </section>
    )
}
