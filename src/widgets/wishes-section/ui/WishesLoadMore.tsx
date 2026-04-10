'use client'

import {useTranslations} from 'next-intl'

import {cn} from '@shared/lib/cn'
import {Button} from '@shared/ui/Button'

type WishesLoadMoreProps = {
    hasMore: boolean
    loading: boolean
    onLoadMore: () => void
    className?: string
}

export function WishesLoadMore({
                                   hasMore,
                                   loading,
                                   onLoadMore,
                                   className,
                               }: WishesLoadMoreProps) {
    const t = useTranslations('wishes')

    return (
        <div className={cn('mt-8 flex justify-center', className)}>
            <Button
                type="button"
                variant="outline"
                disabled={!hasMore || loading}
                onClick={() => void onLoadMore()}
            >
                {loading ? t('loadMoreLoading') : t('loadMore')}
            </Button>
        </div>
    )
}
