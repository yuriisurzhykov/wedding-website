'use client'

import {useCallback, useEffect, useRef, useState} from 'react'

import type {WishView} from '@entities/wish'

import {fetchWishesPage} from '../lib/fetch-wishes-page'
import {
    type WishesPresentation,
    wishesListLimitForPresentation,
} from '../lib/wishes-presentation'
import {WishesFeed} from './WishesFeed'
import {WishesFeedEmpty} from './WishesFeedEmpty'
import {WishesLoadMore} from './WishesLoadMore'

export type WishesFeedClientSlots = {
    feed?: string
    loadMore?: string
    empty?: string
}

type WishesFeedClientProps = {
    initialWishes: WishView[]
    initialHasMore: boolean
    presentation: WishesPresentation
    slots?: WishesFeedClientSlots
}

/**
 * Client island: paginated feed on the full wishes page; preview uses SSR slice only.
 */
export function WishesFeedClient({
    initialWishes,
    initialHasMore,
    presentation,
    slots,
}: WishesFeedClientProps) {
    const pageSize = wishesListLimitForPresentation(presentation)
    const serverSigRef = useRef(
        `${initialWishes.map((w) => w.id).join(',')}:${initialHasMore}`,
    )
    const [wishes, setWishes] = useState<WishView[]>(initialWishes)
    const [hasMore, setHasMore] = useState(initialHasMore)
    const [loadingMore, setLoadingMore] = useState(false)

    useEffect(() => {
        const nextSig = `${initialWishes.map((w) => w.id).join(',')}:${initialHasMore}`
        if (nextSig !== serverSigRef.current) {
            serverSigRef.current = nextSig
            setWishes(initialWishes)
            setHasMore(initialHasMore)
        }
    }, [initialWishes, initialHasMore])

    const loadMore = useCallback(async () => {
        if (!hasMore || loadingMore || presentation !== 'full') {
            return
        }
        setLoadingMore(true)
        const next = await fetchWishesPage(wishes.length, pageSize)
        setLoadingMore(false)
        if (!next) {
            return
        }
        setWishes((prev) => [...prev, ...next.wishes])
        setHasMore(next.hasMore)
    }, [hasMore, loadingMore, pageSize, presentation, wishes.length])

    if (wishes.length === 0) {
        return <WishesFeedEmpty className={slots?.empty}/>
    }

    return (
        <>
            <WishesFeed wishes={wishes} className={slots?.feed}/>
            {presentation === 'full' ? (
                <WishesLoadMore
                    hasMore={hasMore}
                    loading={loadingMore}
                    onLoadMore={loadMore}
                    className={slots?.loadMore}
                />
            ) : null}
        </>
    )
}
