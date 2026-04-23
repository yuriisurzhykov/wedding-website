import {Link} from '@/i18n/navigation'
import {cn} from '@shared/lib/cn'
import type {ReactNode} from 'react'

export type DashboardStatCardProps = Readonly<{
    /** Primary metric; usually a pre-formatted string from the server. */
    value: ReactNode
    /** Short description under the value; pass translated copy from the parent. */
    label: ReactNode
    /** When set, the whole card is a locale-aware link to an admin route. */
    href?: string
    /** Optional pill or count (e.g. “online now”); pass translated copy from the parent. */
    badge?: ReactNode
    /** Optional second line (breakdown, delta, or formatted sub-stat). */
    secondary?: ReactNode
    className?: string
}>

/**
 * KPI tile for the admin dashboard: display font metric, muted label, optional badge and sub-line.
 * With `href`, the surface is a single focusable link for keyboard and screen-reader users.
 */
export function DashboardStatCard({value, label, href, badge, secondary, className}: DashboardStatCardProps) {
    const labelClass = cn(
        'mt-2 text-small text-text-muted transition-colors',
        href && 'group-hover:text-text-secondary',
    )

    const body = (
        <>
            <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="font-display text-h1 tabular-nums leading-none text-primary">{value}</p>
                {badge ? (
                    <span className="shrink-0 rounded-full bg-bg-section px-2.5 py-0.5 text-caption font-medium text-text-secondary">
                        {badge}
                    </span>
                ) : null}
            </div>
            <p className={labelClass}>{label}</p>
            {secondary ? <p className="mt-2 text-caption text-text-secondary">{secondary}</p> : null}
        </>
    )

    const shellClass = cn(
        'rounded-lg border border-border bg-bg-card p-6 shadow-card transition-colors',
        href &&
            'group hover:border-primary/25 hover:bg-bg-section/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus',
        className,
    )

    if (href) {
        return (
            <Link href={href} className={cn(shellClass, 'block no-underline')}>
                {body}
            </Link>
        )
    }

    return <div className={shellClass}>{body}</div>
}
