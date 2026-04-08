'use client'

import {useTranslations} from 'next-intl'

import {cn} from '@shared/lib/cn'

type GalleryEmptyStateProps = {
    className?: string
}

export function GalleryEmptyState({className}: GalleryEmptyStateProps) {
    const t = useTranslations('gallery')

    return (
        <p
            className={cn(
                'mt-10 text-center text-body text-text-secondary',
                className,
            )}
        >
            {t('empty')}
        </p>
    )
}
