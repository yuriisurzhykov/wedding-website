'use client'

import {Link} from '@/i18n/navigation'
import type {DashboardStats} from '@features/admin-dashboard'
import {cn} from '@shared/lib/cn'
import {useTranslations} from 'next-intl'
import {useId, useState} from 'react'

export type DashboardAlertsPanelProps = {
    alerts: DashboardStats['alerts']
}

type AlertPeriod = '24h' | '7d'

/**
 * Heuristic problems for operators: RSVP data inconsistencies, recently expired guest sessions, and failed outbound
 * sends. Period toggle switches the time window for session and email counts; RSVP row reflects current bad rows.
 */
export function DashboardAlertsPanel({alerts}: DashboardAlertsPanelProps) {
    const t = useTranslations('admin.dashboard')
    const baseId = useId()
    const [period, setPeriod] = useState<AlertPeriod>('24h')

    const sessionsExpired = period === '24h' ? alerts.sessionsExpiredLast24h : alerts.sessionsExpiredLast7d
    const emailsFailed = period === '24h' ? alerts.emailsFailedLast24h : alerts.emailsFailedLast7d
    const total = alerts.rsvpAttendingZeroGuests + sessionsExpired + emailsFailed

    const tabIds = {
        '24h': `${baseId}-tab-24h`,
        '7d': `${baseId}-tab-7d`,
    } as const
    const panelId = `${baseId}-panel`

    return (
        <section className="rounded-lg border border-border bg-bg-card p-6 shadow-card">
            <h2 className="font-display text-h3 text-text-primary">{t('alerts.title')}</h2>
            <p className="mt-2 text-caption text-text-secondary">{t('alerts.subtitle')}</p>

            <div
                className="mt-4 flex gap-2 border-b border-border pb-px"
                role="tablist"
                aria-label={t('alerts.periodTabsAria')}
            >
                {(['24h', '7d'] as const).map((key) => (
                    <button
                        key={key}
                        type="button"
                        role="tab"
                        id={tabIds[key]}
                        aria-selected={period === key}
                        aria-controls={panelId}
                        className={cn(
                            '-mb-px border-b-2 px-3 py-2 text-small font-medium transition-colors',
                            period === key
                                ? 'border-primary text-text-primary'
                                : 'border-transparent text-text-muted hover:text-text-secondary',
                        )}
                        onClick={() => setPeriod(key)}
                    >
                        {key === '24h' ? t('alerts.last24h') : t('alerts.last7d')}
                    </button>
                ))}
            </div>

            <div
                id={panelId}
                role="tabpanel"
                aria-labelledby={period === '24h' ? tabIds['24h'] : tabIds['7d']}
                className="mt-4"
            >
                {total === 0 ? (
                    <p className="text-body text-text-secondary">{t('alerts.noProblems')}</p>
                ) : (
                    <p className="text-body font-medium text-text-primary">
                        {t('alerts.issueCount', {count: total})}
                    </p>
                )}

                <ul className="mt-4 space-y-3 text-body">
                    <li className="flex flex-wrap items-baseline justify-between gap-2 gap-y-1 border-b border-border/60 pb-3">
                        <span className="text-text-secondary">{t('alerts.rsvpAttendingZeroGuests')}</span>
                        <span className="tabular-nums font-medium text-text-primary">
                            {alerts.rsvpAttendingZeroGuests}
                        </span>
                    </li>
                    <li className="flex flex-wrap items-baseline justify-between gap-2 gap-y-1 border-b border-border/60 pb-3">
                        <span className="text-text-secondary">{t('alerts.sessionsExpired')}</span>
                        <span className="tabular-nums font-medium text-text-primary">{sessionsExpired}</span>
                    </li>
                    <li className="flex flex-wrap items-baseline justify-between gap-2 gap-y-1">
                        <span className="text-text-secondary">{t('alerts.emailsFailed')}</span>
                        <span className="tabular-nums font-medium text-text-primary">{emailsFailed}</span>
                    </li>
                </ul>

                {(alerts.rsvpAttendingZeroGuests > 0 || sessionsExpired > 0) && (
                    <p className="mt-4 text-small">
                        <Link href="/admin/guests" className="text-primary underline underline-offset-2">
                            {t('alerts.viewGuests')}
                        </Link>
                    </p>
                )}
                {emailsFailed > 0 ? (
                    <p className="mt-2 text-small">
                        <Link href="/admin/email" className="text-primary underline underline-offset-2">
                            {t('alerts.viewEmailLog')}
                        </Link>
                    </p>
                ) : null}
            </div>
        </section>
    )
}
