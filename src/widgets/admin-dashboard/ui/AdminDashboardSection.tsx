import {fetchDashboardStats} from '@features/admin-dashboard'
import {getLocale, getTranslations} from 'next-intl/server'

import {DashboardAlertsPanel} from './DashboardAlertsPanel'
import {DashboardAllergyList} from './DashboardAllergyList'
import {DashboardStatCard} from './DashboardStatCard'

function formatApproxStorage(bytes: number, locale: string): string {
    if (!Number.isFinite(bytes) || bytes <= 0) {
        return new Intl.NumberFormat(locale, {maximumFractionDigits: 0, style: 'unit', unit: 'byte'}).format(0)
    }
    const mb = bytes / (1024 * 1024)
    if (mb < 1024) {
        return new Intl.NumberFormat(locale, {
            maximumFractionDigits: mb < 10 ? 1 : 0,
            style: 'unit',
            unit: 'megabyte',
        }).format(mb)
    }
    const gb = mb / 1024
    return new Intl.NumberFormat(locale, {
        maximumFractionDigits: gb < 10 ? 2 : 1,
        style: 'unit',
        unit: 'gigabyte',
    }).format(gb)
}

/**
 * Server-rendered admin home: loads {@link fetchDashboardStats} and lays out KPI tiles and dietary notes.
 */
export async function AdminDashboardSection() {
    const t = await getTranslations('admin.dashboard')
    const locale = await getLocale()
    const result = await fetchDashboardStats()

    if (!result.ok) {
        return (
            <div className="space-y-6">
                <header>
                    <h1 className="font-display text-h2 text-text-primary">{t('title')}</h1>
                    <p className="mt-2 text-body text-text-secondary">{t('subtitle')}</p>
                </header>
                <div
                    className="rounded-lg border border-border border-destructive/30 bg-bg-card p-6 shadow-card"
                    role="alert"
                >
                    <p className="font-medium text-text-primary">
                        {result.kind === 'config' ? t('loadErrorConfig') : t('loadErrorDatabase')}
                    </p>
                    <p className="mt-2 text-caption text-text-muted">{result.message}</p>
                </div>
            </div>
        )
    }

    const {stats} = result
    const storageLabel = formatApproxStorage(stats.gallery.totalSizeBytes, locale)

    return (
        <div className="space-y-10">
            <header>
                <h1 className="font-display text-h2 text-text-primary">{t('title')}</h1>
                <p className="mt-2 text-body text-text-secondary">{t('subtitle')}</p>
            </header>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <DashboardStatCard
                    href="/admin/guests"
                    value={stats.rsvp.total}
                    label={t('stats.rsvpTotal')}
                    secondary={t('stats.rsvpBreakdown', {
                        attending: stats.rsvp.attending,
                        declined: stats.rsvp.declined,
                    })}
                />
                <DashboardStatCard
                    href="/admin/guests"
                    value={stats.rsvp.totalGuests}
                    label={t('stats.totalGuests')}
                />
                <DashboardStatCard
                    href="/admin/wishes"
                    value={stats.wishes.total}
                    label={t('stats.wishes')}
                />
                <DashboardStatCard
                    href="/admin/gallery"
                    value={stats.gallery.totalPhotos}
                    label={t('stats.photos')}
                />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <DashboardStatCard value={storageLabel} label={t('stats.storageUsed')} />
                <DashboardStatCard
                    href="/admin/guests"
                    value={stats.accounts.total}
                    label={t('stats.accounts')}
                    badge={t('stats.onlineNow', {count: stats.accounts.onlineNow})}
                />
                <DashboardStatCard
                    href="/admin/mail"
                    value={stats.mail.unread}
                    label={t('stats.unreadMail')}
                    secondary={t('stats.inboundTotal', {count: stats.mail.totalInbound})}
                />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <DashboardAllergyList allergies={stats.allergies} />
                <DashboardAlertsPanel alerts={stats.alerts} />
            </div>
        </div>
    )
}
