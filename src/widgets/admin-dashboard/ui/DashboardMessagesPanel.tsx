import {Link} from '@/i18n/navigation'
import type {DashboardStats} from '@features/admin-dashboard'
import {getTranslations} from 'next-intl/server'

export type DashboardMessagesPanelProps = {
    mail: DashboardStats['mail']
}

/**
 * Inbox summary panel: total and unread message counts with a CTA linking to the admin inbox.
 */
export async function DashboardMessagesPanel({mail}: DashboardMessagesPanelProps) {
    const t = await getTranslations('admin.dashboard')

    return (
        <section className="flex flex-col rounded-xl border border-border bg-bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-display text-h3 text-text-primary">
                    <svg
                        className="size-5 text-primary"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        viewBox="0 0 24 24"
                    >
                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                    </svg>
                    {t('messages.title')}
                </h2>
                <Link
                    href="/admin/mail"
                    className="text-small font-medium text-primary no-underline hover:text-primary-dark"
                >
                    {t('messages.viewAll')}
                </Link>
            </div>

            <div className="mt-5 flex-1 space-y-4">
                <div>
                    <p className="text-xs text-text-muted">{t('messages.totalLabel')}</p>
                    <p className="font-display text-h2 tabular-nums leading-tight text-text-primary">
                        {mail.totalInbound}
                    </p>
                </div>
                <div>
                    <p className="text-xs text-text-muted">{t('messages.unreadLabel')}</p>
                    <p className="font-display text-h2 tabular-nums leading-tight text-text-primary">{mail.unread}</p>
                </div>
            </div>

            <Link
                href="/admin/mail"
                className="mt-5 block rounded-lg bg-primary px-4 py-2.5 text-center text-small font-medium text-text-on-brand no-underline shadow-button transition-colors hover:bg-primary-dark"
            >
                {t('messages.goTo')}
            </Link>
        </section>
    )
}
