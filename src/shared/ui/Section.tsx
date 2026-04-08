import type {ReactNode} from 'react'

import {cn} from '@shared/lib/cn'

type SectionTheme = 'base' | 'alt' | 'dark'

export function Section({
    id,
    theme = 'base',
    className,
    children,
}: {
    id?: string
    theme?: SectionTheme
    className?: string
    children: ReactNode
}) {
    const bgMap: Record<SectionTheme, string> = {
        base: 'bg-bg-base',
        alt: 'bg-bg-section',
        dark: 'bg-text-primary',
    }

    return (
        <section
            id={id}
            data-theme={theme === 'dark' ? 'dark-section' : undefined}
            className={cn(
                'py-(--spacing-section)',
                bgMap[theme],
                id && 'scroll-mt-16',
                className,
            )}
        >
            <div
                className="mx-auto px-4 sm:px-8"
                style={{maxWidth: 'var(--max-width)'}}
            >
                {children}
            </div>
        </section>
    )
}
