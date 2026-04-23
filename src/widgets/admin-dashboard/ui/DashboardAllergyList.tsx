import {Link} from '@/i18n/navigation'
import type {DashboardStats} from '@features/admin-dashboard'
import {getTranslations} from 'next-intl/server'

export type DashboardAllergyListProps = {
    allergies: DashboardStats['allergies']
}

/** Group free-text dietary notes by exact value (case-insensitive), sorted by count desc. */
function groupDietaryNotes(
    allergies: DashboardStats['allergies'],
): Array<{note: string; count: number}> {
    const groups = new Map<string, {display: string; count: number}>()
    for (const {dietary} of allergies) {
        const key = dietary.trim().toLowerCase()
        const existing = groups.get(key)
        if (existing) {
            existing.count++
        } else {
            groups.set(key, {display: dietary.trim(), count: 1})
        }
    }
    return Array.from(groups.values())
        .map(({display, count}) => ({note: display, count}))
        .sort((a, b) => b.count - a.count)
}

/**
 * Allergies / dietary summary panel with proportional bars.
 * Groups identical notes and shows up to 6 entries sorted by frequency.
 */
export async function DashboardAllergyList({allergies}: DashboardAllergyListProps) {
    const t = await getTranslations('admin.dashboard')
    const groups = groupDietaryNotes(allergies)
    const maxCount = Math.max(1, ...groups.map((g) => g.count))

    return (
        <section className="rounded-xl border border-border bg-bg-card p-5 shadow-sm">
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
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                    {t('allergies.title')}
                </h2>
                <Link
                    href="/admin/guests"
                    className="text-small font-medium text-primary no-underline hover:text-primary-dark"
                >
                    {t('allergies.viewAll')}
                </Link>
            </div>

            {allergies.length === 0 ? (
                <p className="mt-4 text-body text-text-secondary">{t('allergies.empty')}</p>
            ) : (
                <div className="mt-5 space-y-3">
                    {groups.slice(0, 6).map((group) => (
                        <div key={group.note} className="flex items-center gap-3">
                            <svg className="size-3 shrink-0 text-primary" fill="currentColor" viewBox="0 0 24 24">
                                <circle cx="12" cy="12" r="6" />
                            </svg>
                            <span className="w-24 shrink-0 truncate text-small text-text-primary">{group.note}</span>
                            <div className="flex-1">
                                <div className="h-2 overflow-hidden rounded-full bg-bg-section">
                                    <div
                                        className="h-full rounded-full bg-primary/50"
                                        style={{width: `${(group.count / maxCount) * 100}%`}}
                                    />
                                </div>
                            </div>
                            <span className="shrink-0 text-xs tabular-nums text-text-muted">
                                {t('allergies.guestCount', {count: group.count})}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </section>
    )
}
