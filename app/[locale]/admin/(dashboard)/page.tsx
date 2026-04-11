import {Link} from '@/i18n/navigation'
import type {Metadata} from 'next'
import {getTranslations} from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('admin.dashboard')
    return {
        title: t('metaTitle'),
        robots: {index: false, follow: false},
    }
}

export default async function AdminDashboardPage() {
    const t = await getTranslations('admin.dashboard')

    return (
        <div className="rounded-lg border border-border bg-bg-card p-6 shadow-card">
            <h1 className="font-display text-h2 text-text-primary">{t('title')}</h1>
            <p className="mt-2 text-body text-text-secondary">{t('subtitle')}</p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                <li className="rounded-md border border-border bg-bg-base px-4 py-3">
                    <p className="text-h2 font-display text-primary">{t('placeholders.rsvp')}</p>
                    <p className="text-small text-text-muted">{t('placeholders.rsvpLabel')}</p>
                </li>
                <li className="rounded-md border border-border bg-bg-base px-4 py-3">
                    <p className="text-h2 font-display text-primary">{t('placeholders.photos')}</p>
                    <p className="text-small text-text-muted">{t('placeholders.photosLabel')}</p>
                </li>
            </ul>
            <p className="mt-6 text-body text-text-secondary">
                <Link href="/admin/guests" className="text-primary underline">
                    {t('linkGuests')}
                </Link>
            </p>
        </div>
    )
}
