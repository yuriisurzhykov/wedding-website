import {Link} from '@/i18n/navigation'
import {cn} from '@shared/lib/cn'
import type {ReactNode} from 'react'

export type DashboardStatCardProps = Readonly<{
    value: ReactNode
    label: ReactNode
    href?: string
    icon?: ReactNode
    iconVariant?: 'default' | 'warning' | 'danger'
    badge?: ReactNode
    secondary?: ReactNode
    secondaryVariant?: 'default' | 'warning'
    progress?: number
    className?: string
}>

/**
 * KPI tile for the admin dashboard: icon in a tinted circle, label, display-font metric,
 * optional badge, sub-line, and progress bar. With `href` the surface is a single
 * focusable link for keyboard and screen-reader users.
 */
export function DashboardStatCard({
    value,
    label,
    href,
    icon,
    iconVariant = 'default',
    badge,
    secondary,
    secondaryVariant = 'default',
    progress,
    className,
}: DashboardStatCardProps) {
    const iconWrapperClass = cn(
        'flex size-10 shrink-0 items-center justify-center rounded-full',
        iconVariant === 'default' && 'bg-primary/10 text-primary',
        iconVariant === 'warning' && 'bg-status-warning-subtle text-status-warning',
        iconVariant === 'danger' && 'bg-status-danger-subtle text-status-danger',
    )

    const body = (
        <>
            <div className="flex items-center gap-3">
                {icon ? <div className={iconWrapperClass}>{icon}</div> : null}
                <p className="text-small font-medium text-text-secondary">{label}</p>
            </div>
            <div className="mt-3 flex flex-wrap items-end justify-between gap-2">
                <p className="font-display text-h1 tabular-nums leading-none text-text-primary">{value}</p>
                {badge ? (
                    <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                        {badge}
                    </span>
                ) : null}
            </div>
            {secondary ? (
                <p
                    className={cn(
                        'mt-2 text-xs',
                        secondaryVariant === 'warning' ? 'font-medium text-status-warning' : 'text-text-muted',
                    )}
                >
                    {secondary}
                </p>
            ) : null}
            {typeof progress === 'number' ? (
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-bg-section">
                    <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{width: `${Math.min(100, Math.max(0, progress))}%`}}
                    />
                </div>
            ) : null}
        </>
    )

    const shellClass = cn(
        'rounded-xl border border-border bg-bg-card p-5 shadow-sm transition-colors',
        href &&
            'group hover:border-primary/25 hover:shadow-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focus',
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
