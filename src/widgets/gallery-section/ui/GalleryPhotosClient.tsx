'use client'

import {useCallback, useEffect, useRef, useState} from 'react'
import {useTranslations} from 'next-intl'
import {toast} from 'sonner'

import {type FeatureState, isFeatureEnabled, isFeatureHidden, isFeaturePreview,} from '@entities/site-settings'
import type {GalleryPhotoView} from '@entities/photo'
import {GuestSessionRestoreForm, useGuestSession} from '@features/guest-session'
import {Link} from '@/i18n/navigation'
import {PhotoUploader} from '@shared/ui'

import {deleteGalleryPhotoRequest} from '../lib/delete-gallery-photo-client'
import {fetchGalleryPhotosPage} from '../lib/fetch-gallery-page'
import {galleryListLimitForPresentation, type GalleryPresentation,} from '../lib/gallery-presentation'
import {GalleryDeleteConfirmDialog} from './GalleryDeleteConfirmDialog'
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
    galleryBrowse: FeatureState
    galleryUpload: FeatureState
    galleryPhotoDelete: FeatureState
    slots?: GalleryPhotosClientSlots
}

/**
 * Client island: upload, refetch list from API after success, thumbnails + lightbox.
 */
export function GalleryPhotosClient({
                                        initialPhotos,
                                        initialHasMore,
                                        presentation,
                                        galleryBrowse,
                                        galleryUpload,
                                        galleryPhotoDelete,
                                        slots,
                                    }: GalleryPhotosClientProps) {
    const {status: guestStatus, session} = useGuestSession()
    const browseEnabled = isFeatureEnabled(galleryBrowse)
    const deleteInteractive = isFeatureEnabled(galleryPhotoDelete)
    const uploadHidden = isFeatureHidden(galleryUpload)
    const uploadPreviewOnly = isFeaturePreview(galleryUpload)
    const uploadInteractive = isFeatureEnabled(galleryUpload)
    const t = useTranslations('gallery')
    const tErr = useTranslations('guestSession.errors')
    const pageSize = galleryListLimitForPresentation(presentation)
    const serverSigRef = useRef(
        `${initialPhotos.map((p) => p.id).join(',')}:${initialHasMore}`,
    )
    const [photos, setPhotos] = useState<GalleryPhotoView[]>(initialPhotos)
    const [hasMore, setHasMore] = useState(initialHasMore)
    const [loadingMore, setLoadingMore] = useState(false)
    const [openIndex, setOpenIndex] = useState<number | null>(null)
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
    const [deleteBusy, setDeleteBusy] = useState(false)

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

    const prevGuestStatusRef = useRef(guestStatus)
    useEffect(() => {
        const was = prevGuestStatusRef.current
        prevGuestStatusRef.current = guestStatus
        if (guestStatus !== 'authenticated') {
            return
        }
        if (was === 'authenticated') {
            return
        }
        void refetchPhotos()
    }, [guestStatus, refetchPhotos])

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

    const requestDeleteById = useCallback((photoId: string) => {
        setPendingDeleteId(photoId)
    }, [])

    const cancelPendingDelete = useCallback(() => {
        if (!deleteBusy) {
            setPendingDeleteId(null)
        }
    }, [deleteBusy])

    const confirmPendingDelete = useCallback(async () => {
        if (!pendingDeleteId) {
            return
        }
        setDeleteBusy(true)
        const id = pendingDeleteId
        const result = await deleteGalleryPhotoRequest(id)
        setDeleteBusy(false)

        if (result.ok) {
            setPendingDeleteId(null)
            setPhotos((prev) => {
                const deleteIndex = prev.findIndex((p) => p.id === id)
                const next = prev.filter((p) => p.id !== id)
                setOpenIndex((oi) => {
                    if (oi === null) {
                        return null
                    }
                    if (next.length === 0) {
                        return null
                    }
                    if (deleteIndex === -1) {
                        return oi
                    }
                    if (oi === deleteIndex) {
                        return Math.min(deleteIndex, next.length - 1)
                    }
                    if (oi > deleteIndex) {
                        return oi - 1
                    }
                    return oi
                })
                serverSigRef.current = `${next.map((p) => p.id).join(',')}:${hasMore}`
                return next
            })
            toast.success(t('deleteSuccess'))
            return
        }

        const code = result.code
        let message = t('deleteErrorGeneric')
        if (code === 'photo_delete_forbidden') {
            message = tErr('photo_delete_forbidden.title')
        } else if (code === 'upload_no_session') {
            message = tErr('upload_no_session.title')
        } else if (code === 'guest_session_expired') {
            message = tErr('guest_session_expired.title')
        } else if (code === 'guest_session_missing') {
            message = tErr('guest_session_missing.title')
        } else if (code === 'guest_session_invalid') {
            message = tErr('guest_session_invalid.title')
        } else if (code === 'request_failed') {
            message = tErr('request_failed.title')
        } else if (code === 'server_error') {
            message = tErr('server_error.title')
        } else if (code === 'celebration_not_live') {
            message = tErr('celebration_not_live.title')
        }
        toast.error(message)
    }, [pendingDeleteId, hasMore, t, tErr])

    const handleRequestDeleteFromLightbox = useCallback(() => {
        if (!deleteInteractive || openIndex === null) {
            return
        }
        const p = photos[openIndex]
        if (p?.canDelete) {
            requestDeleteById(p.id)
        }
    }, [deleteInteractive, openIndex, photos, requestDeleteById])

    if (!browseEnabled) {
        const pendingOnly = (
            <p className="mx-auto max-w-[min(36rem,var(--content-width))] text-center font-display text-body leading-relaxed text-text-secondary">
                {t('previewNotice')}
            </p>
        )
        const pendingBlock =
            presentation === 'full' ? (
                <div className="mx-auto w-full max-w-xl">{pendingOnly}</div>
            ) : (
                pendingOnly
            )
        return slots?.uploader ? (
            <div className={slots.uploader}>{pendingBlock}</div>
        ) : (
            pendingBlock
        )
    }

    const guestUpload =
        guestStatus === 'loading'
            ? {status: 'loading' as const}
            : guestStatus === 'authenticated' && session
                ? {
                    status: 'authenticated' as const,
                    displayName: session.displayName,
                }
                : {status: 'anonymous' as const}

    const showRestoreForm =
        uploadInteractive &&
        guestStatus === 'anonymous' &&
        presentation === 'full'
    const showHomeAnonymousHint =
        uploadInteractive &&
        guestStatus === 'anonymous' &&
        presentation === 'preview'

    const uploadBlock = uploadHidden ? null : uploadPreviewOnly ? (
        <p className="mx-auto max-w-[min(36rem,var(--content-width))] text-center font-display text-body leading-relaxed text-text-secondary">
            {t('uploadPreviewNotice')}
        </p>
    ) : (
        <>
            {showRestoreForm ? (
                <GuestSessionRestoreForm
                    className="mb-8 w-full"
                    onSuccess={() => void refetchPhotos()}
                />
            ) : null}
            {showHomeAnonymousHint ? (
                <p className="mx-auto mb-6 max-w-[min(36rem,var(--content-width))] text-center font-display text-h3 font-medium leading-relaxed text-text-secondary">
                    {t.rich('uploadHintAnonymousHome', {
                        rsvp: (chunks) => (
                            <Link
                                href={{pathname: '/guest/sign-in'}}
                                className="text-primary underline decoration-primary/50 underline-offset-[0.2em] transition hover:decoration-primary"
                            >
                                {chunks}
                            </Link>
                        ),
                    })}
                </p>
            ) : null}
            <PhotoUploader
                guestUpload={guestUpload}
                onUploadSuccess={refetchPhotos}
                suppressAnonymousHelpText={showHomeAnonymousHint}
                uploadMediaPurpose="gallery"
            />
        </>
    )

    const uploader =
        uploadBlock === null ? null : presentation === 'full' ? (
            <div className="mx-auto w-full max-w-xl">{uploadBlock}</div>
        ) : (
            uploadBlock
        )

    return (
        <>
            {uploader === null ? null : slots?.uploader ? (
                <div className={slots.uploader}>{uploader}</div>
            ) : (
                uploader
            )}
            {photos.length === 0 ? (
                <GalleryEmptyState className={slots?.empty}/>
            ) : null}
            {photos.length > 0 ? (
                <GalleryPhotoGrid
                    photos={photos}
                    onOpenPhoto={setOpenIndex}
                    onRequestDelete={
                        deleteInteractive ? requestDeleteById : undefined
                    }
                    className={slots?.grid}
                />
            ) : null}
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
                onRequestDelete={
                    deleteInteractive ? handleRequestDeleteFromLightbox : undefined
                }
            />
            <GalleryDeleteConfirmDialog
                open={pendingDeleteId !== null}
                isDeleting={deleteBusy}
                onConfirm={confirmPendingDelete}
                onCancel={cancelPendingDelete}
            />
        </>
    )
}
