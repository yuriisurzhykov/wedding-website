'use client'

import {Link} from '@/i18n/navigation'
import {
    isRouteNavEntry,
    isSectionNavEntry,
    type SiteNavRegistryEntry,
} from '@entities/site-nav'
import {cn} from '@shared/lib/cn'

type NavLayout = 'bar' | 'drawer'

const barLinkClass =
    'text-small text-text-secondary hover:text-text-primary transition-colors duration-fast'

const drawerClass = cn(
    'block w-full rounded-md px-3 py-3 text-left text-body text-text-secondary',
    'hover:bg-bg-section hover:text-text-primary transition-colors duration-fast',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus',
)

const drawerButtonClass = cn(
    'w-full rounded-md px-3 py-3 text-left text-body text-text-secondary',
    'hover:bg-bg-section hover:text-text-primary transition-colors duration-fast',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus',
)

type Props = Readonly<{
    item: SiteNavRegistryEntry
    layout: NavLayout
    onHome: boolean
    label: string
    scrollToSectionId: (sectionId: string) => void
    closeDrawer: () => void
}>

export function SiteNavRegistryEntryControl({
    item,
    layout,
    onHome,
    label,
    scrollToSectionId,
    closeDrawer,
}: Props) {
    if (isRouteNavEntry(item)) {
        return (
            <Link
                href={item.pathname}
                onClick={layout === 'drawer' ? closeDrawer : undefined}
                className={layout === 'bar' ? barLinkClass : drawerClass}
            >
                {label}
            </Link>
        )
    }

    if (!isSectionNavEntry(item)) {
        return null
    }

    if (onHome) {
        return (
            <button
                type="button"
                onClick={() => scrollToSectionId(item.sectionId)}
                className={layout === 'bar' ? barLinkClass : drawerButtonClass}
            >
                {label}
            </button>
        )
    }

    return (
        <Link
            href={{pathname: '/', hash: item.sectionId}}
            onClick={layout === 'drawer' ? closeDrawer : undefined}
            className={layout === 'bar' ? barLinkClass : drawerClass}
        >
            {label}
        </Link>
    )
}
