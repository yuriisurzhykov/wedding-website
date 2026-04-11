import {Link} from '@/i18n/navigation'
import {cn} from '@shared/lib/cn'

import {ADMIN_NAV_ITEMS} from '../model/admin-nav'
import {getTranslations} from 'next-intl/server'
import type {ReactNode} from 'react'

import {AdminLogoutButton} from './AdminLogoutButton'

type Props = Readonly<{
    children: ReactNode
}>

export async function AdminShell({children}: Props) {
    const t = await getTranslations('admin.shell')

    return (
        <div className="min-h-[70vh] bg-bg-base">
            <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 md:flex-row md:gap-10">
                <aside
                    className="shrink-0 rounded-lg border border-border bg-bg-card p-4 shadow-card md:w-56"
                    aria-label={t('navAria')}
                >
                    <p className="mb-3 font-display text-h3 text-text-primary">
                        {t('title')}
                    </p>
                    <nav className="flex flex-col gap-1">
                        {ADMIN_NAV_ITEMS.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    'rounded-md px-3 py-2 text-body text-text-secondary transition-colors',
                                    'hover:bg-bg-section hover:text-text-primary',
                                )}
                            >
                                {t(`nav.${item.navKey}`)}
                            </Link>
                        ))}
                    </nav>
                    <div className="mt-6 border-t border-border pt-4">
                        <AdminLogoutButton/>
                    </div>
                </aside>
                <div className="min-w-0 flex-1">{children}</div>
            </div>
        </div>
    )
}
