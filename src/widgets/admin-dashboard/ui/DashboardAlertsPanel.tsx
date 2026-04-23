import {Link} from '@/i18n/navigation'
import type {DashboardStats} from '@features/admin-dashboard'
import {cn} from '@shared/lib/cn'
import {getTranslations} from 'next-intl/server'

export type DashboardAlertsPanelProps = {
    alerts: DashboardStats['alerts']
}

type Severity = 'high' | 'medium' | 'low'

const SEVERITY_STYLES: Record<Severity, string> = {
    high: 'bg-status-danger-subtle text-status-danger',
    medium: 'bg-status-warning-subtle text-status-warning',
    low: 'bg-status-success-subtle text-status-success',
}

/**
 * Site issues panel: maps heuristic alert counts to items with severity badges.
 * Shows the 7-day window for session and email alerts; RSVP row reflects current bad rows.
 */
export async function DashboardAlertsPanel({alerts}: DashboardAlertsPanelProps) {
    const t = await getTranslations('admin.dashboard')

    const severityLabels: Record<Severity, string> = {
        high: t('alerts.severityHigh'),
        medium: t('alerts.severityMedium'),
        low: t('alerts.severityLow'),
    }

    const items: Array<{count: number; label: string; severity: Severity; href: string}> = []

    if (alerts.emailsFailedLast7d > 0) {
        items.push({
            count: alerts.emailsFailedLast7d,
            label: t('alerts.emailsFailed'),
            severity: 'high',
            href: '/admin/email',
        })
    }
    if (alerts.rsvpAttendingZeroGuests > 0) {
        items.push({
            count: alerts.rsvpAttendingZeroGuests,
            label: t('alerts.rsvpAttendingZeroGuests'),
            severity: 'medium',
            href: '/admin/guests',
        })
    }
    if (alerts.sessionsExpiredLast7d > 0) {
        items.push({
            count: alerts.sessionsExpiredLast7d,
            label: t('alerts.sessionsExpired'),
            severity: 'low',
            href: '/admin/guests',
        })
    }

    return (
        <section className="rounded-xl border border-border bg-bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-display text-h3 text-text-primary">
                    <svg
                        className="size-5 text-status-warning"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        viewBox="0 0 24 24"
                    >
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    {t('alerts.title')}
                </h2>
                <Link
                    href="/admin/guests"
                    className="text-small font-medium text-primary no-underline hover:text-primary-dark"
                >
                    {t('alerts.viewAll')}
                </Link>
            </div>

            {items.length === 0 ? (
                <p className="mt-4 text-body text-text-secondary">{t('alerts.noProblems')}</p>
            ) : (
                <div className="mt-4 space-y-1">
                    {items.map((item) => (
                        <Link
                            key={item.label}
                            href={item.href}
                            className="-mx-2 flex items-start gap-3 rounded-lg p-3 no-underline transition-colors hover:bg-bg-section"
                        >
                            <svg
                                className="mt-0.5 size-5 shrink-0 text-text-muted"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={1.5}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                viewBox="0 0 24 24"
                            >
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            <div className="min-w-0 flex-1">
                                <p className="text-small font-medium text-text-primary">
                                    {item.count} {item.label}
                                </p>
                                <p className="text-xs text-text-muted">{t('alerts.lastPeriod')}</p>
                            </div>
                            <span
                                className={cn(
                                    'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium',
                                    SEVERITY_STYLES[item.severity],
                                )}
                            >
                                {severityLabels[item.severity]}
                            </span>
                        </Link>
                    ))}
                </div>
            )}
        </section>
    )
}
