import {fetchDashboardStats} from '@features/admin-dashboard'
import {getLocale, getTranslations} from 'next-intl/server'
import type {ReactNode} from 'react'

import {DashboardAlertsPanel} from './DashboardAlertsPanel'
import {DashboardAllergyList} from './DashboardAllergyList'
import {DashboardMessagesPanel} from './DashboardMessagesPanel'
import {DashboardStatCard} from './DashboardStatCard'

function StrokeIcon({children}: {children: ReactNode}) {
    return (
        <svg
            className="size-5"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
        >
            {children}
        </svg>
    )
}

function UsersIcon() {
    return (
        <StrokeIcon>
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </StrokeIcon>
    )
}

function CheckCircleIcon() {
    return (
        <StrokeIcon>
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
        </StrokeIcon>
    )
}

function CameraIcon() {
    return (
        <StrokeIcon>
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
        </StrokeIcon>
    )
}

function DatabaseIcon() {
    return (
        <StrokeIcon>
            <ellipse cx="12" cy="5" rx="9" ry="3" />
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
        </StrokeIcon>
    )
}

function UserPlusIcon() {
    return (
        <StrokeIcon>
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="8.5" cy="7" r="4" />
            <line x1="20" y1="8" x2="20" y2="14" />
            <line x1="23" y1="11" x2="17" y2="11" />
        </StrokeIcon>
    )
}

function WifiIcon() {
    return (
        <StrokeIcon>
            <path d="M5 12.55a11 11 0 0 1 14.08 0" />
            <path d="M1.42 9a16 16 0 0 1 21.16 0" />
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
            <line x1="12" y1="20" x2="12.01" y2="20" />
        </StrokeIcon>
    )
}

function SendIcon() {
    return (
        <StrokeIcon>
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </StrokeIcon>
    )
}

function AlertTriangleIcon() {
    return (
        <StrokeIcon>
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
        </StrokeIcon>
    )
}

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

/** Soft visual cap for the storage progress bar (10 GB). */
const STORAGE_VISUAL_CAP_BYTES = 10 * 1024 * 1024 * 1024

/**
 * Server-rendered admin home: loads {@link fetchDashboardStats} and lays out
 * the full dashboard matching the three-row KPI + panels + footer design.
 */
export async function AdminDashboardSection() {
    const t = await getTranslations('admin.dashboard')
    const locale = await getLocale()
    const result = await fetchDashboardStats()

    if (!result.ok) {
        return (
            <div className="space-y-6">
                <header>
                    <h1 className="font-display text-h1 text-text-primary">{t('title')}</h1>
                    <p className="mt-1 text-body text-text-secondary">{t('subtitle')}</p>
                </header>
                <div className="rounded-xl border border-status-danger/30 bg-bg-card p-6 shadow-sm" role="alert">
                    <p className="font-medium text-text-primary">
                        {result.kind === 'config' ? t('loadErrorConfig') : t('loadErrorDatabase')}
                    </p>
                    <p className="mt-2 text-xs text-text-muted">{result.message}</p>
                </div>
            </div>
        )
    }

    const {stats} = result
    const storageLabel = formatApproxStorage(stats.gallery.totalSizeBytes, locale)
    const rsvpPercentage =
        stats.rsvp.total > 0 ? Math.round((stats.rsvp.attending / stats.rsvp.total) * 100) : 0
    const storageProgress =
        stats.gallery.totalSizeBytes > 0
            ? Math.min(100, (stats.gallery.totalSizeBytes / STORAGE_VISUAL_CAP_BYTES) * 100)
            : 0

    return (
        <div className="space-y-8">
            <header>
                <h1 className="font-display text-h1 text-text-primary">{t('title')}</h1>
                <p className="mt-1 text-body text-text-secondary">{t('subtitle')}</p>
            </header>

            {/* Row 1 — Primary KPIs */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <DashboardStatCard
                    icon={<UsersIcon />}
                    href="/admin/guests"
                    value={stats.rsvp.totalGuests}
                    label={t('stats.totalGuests')}
                    secondary={t('stats.rsvpBreakdown', {
                        attending: stats.rsvp.attending,
                        declined: stats.rsvp.declined,
                    })}
                />
                <DashboardStatCard
                    icon={<CheckCircleIcon />}
                    href="/admin/guests"
                    value={stats.rsvp.total}
                    label={t('stats.rsvpTotal')}
                    secondary={t('stats.rsvpPercentAttending', {percentage: rsvpPercentage})}
                />
                <DashboardStatCard
                    icon={<CameraIcon />}
                    href="/admin/gallery"
                    value={stats.gallery.totalPhotos}
                    label={t('stats.photos')}
                />
                <DashboardStatCard
                    icon={<DatabaseIcon />}
                    value={storageLabel}
                    label={t('stats.storageUsed')}
                    progress={storageProgress}
                />
            </div>

            {/* Row 2 — Detail panels */}
            <div className="grid gap-4 lg:grid-cols-3">
                <DashboardAllergyList allergies={stats.allergies} />
                <DashboardAlertsPanel alerts={stats.alerts} />
                <DashboardMessagesPanel mail={stats.mail} />
            </div>

            {/* Row 3 — Secondary KPIs */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <DashboardStatCard
                    icon={<UserPlusIcon />}
                    href="/admin/guests"
                    value={stats.accounts.total}
                    label={t('stats.accounts')}
                />
                <DashboardStatCard
                    icon={<WifiIcon />}
                    value={stats.accounts.onlineNow}
                    label={t('stats.peopleOnline')}
                    secondary={t('stats.peopleOnlineDesc')}
                />
                <DashboardStatCard
                    icon={<SendIcon />}
                    href="/admin/wishes"
                    value={stats.wishes.total}
                    label={t('stats.totalWishes')}
                    secondary={t('stats.totalWishesDesc')}
                />
                <DashboardStatCard
                    icon={<AlertTriangleIcon />}
                    iconVariant={stats.mail.unread > 0 ? 'warning' : 'default'}
                    href="/admin/mail"
                    value={stats.mail.unread}
                    label={t('stats.unreadMail')}
                    secondary={stats.mail.unread > 0 ? t('stats.unreadMailWarning') : undefined}
                    secondaryVariant={stats.mail.unread > 0 ? 'warning' : 'default'}
                />
            </div>

            {/* Footer */}
            <footer className="flex items-center justify-center gap-2 border-t border-border pt-6 text-small text-text-muted">
                <svg className="size-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                {t('footer')}
            </footer>
        </div>
    )
}
