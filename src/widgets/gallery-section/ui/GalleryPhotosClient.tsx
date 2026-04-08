'use client'

import {useCallback, useEffect, useRef, useState} from 'react'

import type {GalleryPhotoView} from '@entities/photo'
import {PhotoUploader} from '@shared/ui'

import {fetchGalleryPhotosPage} from '../lib/fetch-gallery-page'
import {
    galleryListLimitForPresentation,
    type GalleryPresentation,
} from '../lib/gallery-presentation'
import {GalleryEmptyState} from './GalleryEmptyState'
import {GalleryLightbox} from './GalleryLightbox'
import {GalleryLoadMore} from './GalleryLoadMore'
import {GalleryPhotoGrid} from './GalleryPhotoGrid'

export type GalleryPhotosClientSlots = {
    uploader?: string
    grid?: string
    loadMore?: string
    empty?: string
}

type GalleryPhotosClientProps = {
    initialPhotos: GalleryPhotoView[]
    /** From SSR `listGalleryPhotos`; used for “load more” in `full` presentation. */
    initialHasMore: boolean
    presentation: GalleryPresentation
    slots?: GalleryPhotosClientSlots
}

/**
 * Client island: upload, refetch list from API after success, thumbnails + lightbox.
 */
export function GalleryPhotosClient({
    initialPhotos,
    initialHasMore,
    presentation,
    slots,
}: GalleryPhotosClientProps) {
    const pageSize = galleryListLimitForPresentation(presentation)
    const serverSigRef = useRef(
        `${initialPhotos.map((p) => p.id).join(',')}:${initialHasMore}`,
    )
    const [photos, setPhotos] = useState<GalleryPhotoView[]>(initialPhotos)
    const [hasMore, setHasMore] = useState(initialHasMore)
    const [loadingMore, setLoadingMore] = useState(false)
    const [openIndex, setOpenIndex] = useState<number | null>(null)

    useEffect(() => {
        const nextSig = `${initialPhotos.map((p) => p.id).join(',')}:${initialHasMore}`
        if (nextSig !== serverSigRef.current) {
            serverSigRef.current = nextSig
            setPhotos(initialPhotos)
            setHasMore(initialHasMore)
        }
    }, [initialPhotos, initialHasMore])

    const refetchPhotos = useCallback(async () => {
        const next = await fetchGalleryPhotosPage(0, pageSize)
        if (next) {
            setPhotos(next.photos)
            setHasMore(next.hasMore)
            serverSigRef.current = `${next.photos.map((p) => p.id).join(',')}:${next.hasMore}`
        }
    }, [pageSize])

    const loadMore = useCallback(async () => {
        if (!hasMore || loadingMore || presentation !== 'full') {
            return
        }
        setLoadingMore(true)
        const next = await fetchGalleryPhotosPage(photos.length, pageSize)
        setLoadingMore(false)
        if (!next) {
            return
        }
        setPhotos((prev) => [...prev, ...next.photos])
        setHasMore(next.hasMore)
    }, [hasMore, loadingMore, pageSize, photos.length, presentation])

    const goPrev = useCallback(() => {
        setOpenIndex((i) => {
            if (i === null || photos.length === 0) {
                return i
            }
            return (i - 1 + photos.length) % photos.length
        })
    }, [photos.length])

    const goNext = useCallback(() => {
        setOpenIndex((i) => {
            if (i === null || photos.length === 0) {
                return i
            }
            return (i + 1) % photos.length
        })
    }, [photos.length])

    useEffect(() => {
        if (
            openIndex !== null &&
            (photos.length === 0 || openIndex >= photos.length)
        ) {
            setOpenIndex(null)
        }
    }, [photos, openIndex])

    const handleCloseLightbox = useCallback(() => {
        setOpenIndex(null)
    }, [])

    const uploader = (
        <PhotoUploader onUploadSuccess={refetchPhotos}/>
    )

    return (
        <>
            {slots?.uploader ? (
                <div className={slots.uploader}>{uploader}</div>
            ) : (
                uploader
            )}
            {photos.length === 0 ? (
                <GalleryEmptyState className={slots?.empty}/>
            ) : (
                <GalleryPhotoGrid
                    photos={photos}
                    onOpenPhoto={setOpenIndex}
                    className={slots?.grid}
                />
            )}
            {presentation === 'full' && photos.length > 0 ? (
                <GalleryLoadMore
                    hasMore={hasMore}
                    loading={loadingMore}
                    onLoadMore={loadMore}
                    className={slots?.loadMore}
                />
            ) : null}
            <GalleryLightbox
                photos={photos}
                openIndex={openIndex}
                onClose={handleCloseLightbox}
                onPrev={goPrev}
                onNext={goNext}
            />
        </>
    )
}
