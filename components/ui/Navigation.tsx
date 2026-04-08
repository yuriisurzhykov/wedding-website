'use client'

import {useTranslations} from 'next-intl'
import {NAV_ITEMS} from '@/lib/config/nav'
import {LanguageSwitcher} from './LanguageSwitcher'

export function Navigation() {
    const translator = useTranslations('nav')

    function scrollTo(href: string) {
        document.querySelector(href)?.scrollIntoView({behavior: 'smooth'})
    }

    return (
        <nav
            className="fixed top-0 left-0 right-0 z-50 bg-bg-card/80 backdrop-blur-md border-b border-border"
            aria-label={translator('mainNav')}
        >
            <div className="max-w-(--max-width) mx-auto px-4 h-16 flex items-center justify-between">
                <span className="font-accent text-xl text-primary">{translator('coupleNames')}</span>

                <div className="hidden md:flex items-center gap-6">
                    {NAV_ITEMS.map((item) => (
                        <button
                            key={item.key}
                            type="button"
                            onClick={() => scrollTo(item.href)}
                            className="text-small text-text-secondary hover:text-text-primary transition-colors duration-fast"
                        >
                            {translator(item.key)}
                        </button>
                    ))}
                </div>

                <LanguageSwitcher/>
            </div>
        </nav>
    )
}
