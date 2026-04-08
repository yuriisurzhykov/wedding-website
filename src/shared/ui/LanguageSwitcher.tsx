'use client'

import {useLocale} from 'next-intl'
import {usePathname, useRouter} from '@/i18n/navigation'

import {cn} from '@shared/lib/cn'

export function LanguageSwitcher() {
    const locale = useLocale()
    const router = useRouter()
    const pathname = usePathname()

    function switchTo(newLocale: 'ru' | 'en') {
        router.replace(pathname, {locale: newLocale})
    }

    return (
        <div
            className="flex items-center gap-0.5 rounded-pill border border-border p-1"
            role="group"
            aria-label="Language"
        >
            {(['ru', 'en'] as const).map((loc) => (
                <button
                    key={loc}
                    type="button"
                    onClick={() => switchTo(loc)}
                    aria-pressed={locale === loc}
                    className={cn(
                        'px-3 py-1 rounded-pill text-small font-medium uppercase tracking-wide',
                        'transition-colors duration-fast',
                        locale === loc
                            ? 'bg-primary text-text-on-primary'
                            : 'text-text-secondary hover:text-text-primary',
                    )}
                >
                    {loc}
                </button>
            ))}
        </div>
    )
}
