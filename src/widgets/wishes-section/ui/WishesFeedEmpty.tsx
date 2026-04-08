'use client'

import {useTranslations} from 'next-intl'

import {cn} from '@shared/lib/cn'

type WishesFeedEmptyProps = {
    className?: string
}

export function WishesFeedEmpty({className}: WishesFeedEmptyProps) {
    const t = useTranslations('wishes')

    return (
        <p
            className={cn(
                'mt-6 text-center text-body text-text-secondary',
                className,
            )}
        >
            {t('empty')}
        </p>
    )
}
