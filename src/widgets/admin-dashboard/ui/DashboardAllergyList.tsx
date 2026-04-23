import {Link} from '@/i18n/navigation'
import type {DashboardStats} from '@features/admin-dashboard'
import {getTranslations} from 'next-intl/server'

export type DashboardAllergyListProps = {
    allergies: DashboardStats['allergies']
}

/**
 * Collapsible panel listing RSVP dietary notes with a link to the guests admin list.
 */
export async function DashboardAllergyList({allergies}: DashboardAllergyListProps) {
    const t = await getTranslations('admin.dashboard')

    return (
        <section className="rounded-lg border border-border bg-bg-card p-6 shadow-card">
            <h2 className="font-display text-h3 text-text-primary">{t('allergies.title')}</h2>
            {allergies.length === 0 ? (
                <p className="mt-3 text-body text-text-secondary">{t('allergies.empty')}</p>
            ) : (
                <>
                    <details className="mt-4 group">
                        <summary className="cursor-pointer list-none text-small font-medium text-primary marker:hidden [&::-webkit-details-marker]:hidden">
                            <span className="underline decoration-primary/40 underline-offset-2 group-open:no-underline">
                                {t('allergies.expand', {count: allergies.length})}
                            </span>
                        </summary>
                        <div className="mt-4 overflow-x-auto">
                            <table className="w-full min-w-[280px] border-collapse text-left text-body">
                                <thead>
                                    <tr className="border-b border-border text-caption text-text-muted">
                                        <th className="py-2 pr-4 font-medium">{t('allergies.name')}</th>
                                        <th className="py-2 font-medium">{t('allergies.note')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allergies.map((row, index) => (
                                        <tr key={index} className="border-b border-border/60">
                                            <td className="py-2 pr-4 align-top text-text-primary">
                                                {row.rsvpName.length > 0 ? row.rsvpName : t('allergies.unnamed')}
                                            </td>
                                            <td className="py-2 align-top text-text-secondary">{row.dietary}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </details>
                    <p className="mt-4 text-small">
                        <Link href="/admin/guests" className="text-primary underline underline-offset-2">
                            {t('allergies.viewGuests')}
                        </Link>
                    </p>
                </>
            )}
        </section>
    )
}
