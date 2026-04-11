import {listWishesForAdmin} from '@features/admin-wishes-delete'
import {getLocale, getTranslations} from 'next-intl/server'

import type {AdminWishesTableRow} from '../model/types'

import {AdminWishesDeletePanel} from './AdminWishesDeletePanel'

export async function AdminWishesSection() {
    const t = await getTranslations('admin.wishes')
    const locale = await getLocale()
    const result = await listWishesForAdmin({limit: 50, offset: 0})

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

    const rows: AdminWishesTableRow[] = result.wishes.map((w) => ({
        ...w,
        createdAtLabel: dateFmt.format(new Date(w.createdAt)),
    }))

    return (
        <section className="rounded-lg border border-border bg-bg-card p-6 shadow-card">
            <h1 className="font-display text-h2 text-text-primary">{t('title')}</h1>
            <p className="mt-2 text-body text-text-secondary">{t('subtitle')}</p>

            {rows.length === 0 ? (
                <p className="mt-8 text-body text-text-secondary">{t('empty')}</p>
            ) : (
                <div className="mt-8">
                    <AdminWishesDeletePanel
                        wishes={rows}
                        hasMore={result.hasMore}
                    />
                </div>
            )}
        </section>
    )
}
