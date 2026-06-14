'use client'

import {useCallback, useEffect, useLayoutEffect, useRef, useState} from 'react'
import {useTranslations} from 'next-intl'
import {toast} from 'sonner'

import type {GalleryPhotoView} from '@entities/photo'
import {cn} from '@shared/lib/cn'

import {downloadGalleryPhotoRequest} from '../lib/download-gallery-photo-client'
import {GalleryDownloadIcon} from './GalleryDownloadIcon'
import {GalleryTrashIcon} from './GalleryTrashIcon'
import {GalleryZoomIcon} from './GalleryZoomIcon'
import {
    GalleryZoomablePhoto,
    type GalleryZoomablePhotoHandle,
    type SlideDirection,
} from './GalleryZoomablePhoto'

type GalleryLightboxProps = {
    photos: GalleryPhotoView[]
    openIndex: number | null
    onClose: () => void
    onPrev: () => void
    onNext: () => void
    /** Shown when the current slide is deletable for this viewer. */
    onRequestDelete?: () => void
}

/**
 * Full-screen viewer: native `<dialog>` (focus trap, Escape), prev/next, backdrop click to close.
 *
 * The photo area ({@link GalleryZoomablePhoto}) handles pinch / wheel / double-tap zoom,
 * panning, swipe navigation, and the tap-outside-bitmap-to-close decision.
 */
export function GalleryLightbox(
    {
        photos,
        openIndex,
        onClose,
        onPrev,
        onNext,
        onRequestDelete,
    }: GalleryLightboxProps
) {
    const t = useTranslations('gallery')
    const tApi = useTranslations('apiErrors')
    const dialogRef = useRef<HTMLDialogElement>(null)
    const zoomRef = useRef<GalleryZoomablePhotoHandle>(null)
    const [downloadBusy, setDownloadBusy] = useState(false)

    useEffect(() => {
        const el = dialogRef.current
        if (!el) {
            return
        }
        if (openIndex !== null) {
            if (!el.open) {
                el.showModal()
            }
        } else if (el.open) {
            el.close()
        }
    }, [openIndex])

    useEffect(() => {
        const el = dialogRef.current
        if (!el) {
            return
        }
        const handleClose = () => {
            onClose()
        }
        el.addEventListener('close', handleClose)
        return () => el.removeEventListener('close', handleClose)
    }, [onClose])

    const current = openIndex !== null ? photos[openIndex] : null
    const multi = photos.length > 1
    const canDeleteCurrent = Boolean(current?.canDelete && onRequestDelete)

    const slideEpoch =
        openIndex !== null && current
            ? `${openIndex}-${current.publicUrl}`
            : ''

    const [loadedEpoch, setLoadedEpoch] = useState('')
    const slideReady = Boolean(slideEpoch) && loadedEpoch === slideEpoch

    const [slideEnterDir, setSlideEnterDir] = useState<SlideDirection>(0)
    const activeEpochRef = useRef('')
    const prevNavIndexRef = useRef<number | null>(null)

    const handleShellClick = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            if (
                (e.target as HTMLElement).closest(
                    '[data-lightbox-interactive]',
                )
            ) {
                return
            }
            dialogRef.current?.close()
        },
        [],
    )

    const handleDownload = useCallback(async () => {
        if (!current || downloadBusy) {
            return
        }
        setDownloadBusy(true)
        const result = await downloadGalleryPhotoRequest(current.id)
        setDownloadBusy(false)
        if (!result.ok) {
            toast.error(
                result.code === 'too_many_requests'
                    ? tApi('tooManyRequests')
                    : t('downloadError'),
            )
        }
    }, [current, downloadBusy, t, tApi])

    /* useLayoutEffect: sync slide axis and load reset before paint. */
    useLayoutEffect(() => {
        /* eslint-disable react-hooks/set-state-in-effect -- intentional layout sync */
        activeEpochRef.current = slideEpoch
        if (openIndex === null) {
            prevNavIndexRef.current = null
            setLoadedEpoch('')
            setSlideEnterDir(0)
            return
        }
        const prev = prevNavIndexRef.current
        if (prev !== null && prev !== openIndex) {
            setSlideEnterDir((openIndex > prev ? 1 : -1) as SlideDirection)
        } else {
            setSlideEnterDir(0)
        }
        prevNavIndexRef.current = openIndex
        /* eslint-enable react-hooks/set-state-in-effect */
    }, [openIndex, slideEpoch])

    const revealSlideForEpoch = useCallback((epoch: string) => {
        requestAnimationFrame(() => {
            setLoadedEpoch((cur) =>
                epoch === activeEpochRef.current ? epoch : cur,
            )
        })
    }, [])

    return (
        <dialog
            ref={dialogRef}
            className={cn(
                'fixed inset-0 z-100 m-0 h-full max-h-none w-full max-w-none border-0 bg-transparent p-0',
                'text-text-primary backdrop:bg-black/75',
            )}
            onKeyDown={(e) => {
                if (e.key === 'ArrowLeft') {
                    e.preventDefault()
                    onPrev()
                }
                if (e.key === 'ArrowRight') {
                    e.preventDefault()
                    onNext()
                }
            }}
        >
            {current ? (
                <div
                    className="relative flex h-dvh max-h-dvh w-full flex-col"
                    onClick={handleShellClick}
                >
                    <button
                        type="button"
                        className="absolute inset-0 z-0 bg-black/85"
                        aria-hidden="true"
                        tabIndex={-1}
                    />
                    <div className="pointer-events-none relative z-10 flex min-h-0 flex-1 flex-col">
                        <div className="flex shrink-0 justify-end gap-2 p-3 sm:gap-3 sm:p-4">
                            <button
                                type="button"
                                data-lightbox-interactive
                                className="pointer-events-auto inline-flex items-center gap-2 rounded-pill bg-white/10 px-3 py-2 text-small text-white transition-colors hover:bg-white/20 sm:px-4 sm:text-body"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    zoomRef.current?.toggleZoom()
                                }}
                                aria-label={t('lightboxZoomToggle')}
                            >
                                <GalleryZoomIcon className="size-4 text-white"/>
                            </button>
                            <button
                                type="button"
                                data-lightbox-interactive
                                className="pointer-events-auto inline-flex items-center gap-2 rounded-pill bg-white/10 px-3 py-2 text-small text-white transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60 sm:px-4 sm:text-body"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    void handleDownload()
                                }}
                                disabled={downloadBusy}
                                aria-busy={downloadBusy}
                            >
                                <GalleryDownloadIcon className="size-4 text-white"/>
                                <span className="max-sm:sr-only">
                                    {t('lightboxDownload')}
                                </span>
                            </button>
                            {canDeleteCurrent ? (
                                <button
                                    type="button"
                                    data-lightbox-interactive
                                    className="group pointer-events-auto inline-flex items-center gap-2 rounded-pill bg-white/10 px-3 py-2 text-small text-white transition-colors hover:bg-white/20 sm:px-4 sm:text-body"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onRequestDelete?.()
                                    }}
                                >
                                    <GalleryTrashIcon className="size-4 text-white"/>
                                    <span className="max-sm:sr-only">
                                        {t('deleteLightboxLabel')}
                                    </span>
                                </button>
                            ) : null}
                            <button
                                type="button"
                                data-lightbox-interactive
                                className="pointer-events-auto rounded-pill bg-white/10 px-4 py-2 text-body text-white transition-colors hover:bg-white/20"
                                onClick={() => dialogRef.current?.close()}
                            >
                                {t('lightboxClose')}
                            </button>
                        </div>
                        <div
                            className="flex min-h-0 flex-1 items-stretch justify-center gap-2 px-2 pb-4 sm:gap-4 sm:px-6">
                            {multi ? (
                                <button
                                    type="button"
                                    data-lightbox-interactive
                                    className="pointer-events-auto shrink-0 self-center rounded-pill bg-white/10 px-3 py-3 text-2xl text-white transition-colors hover:bg-white/20 sm:px-4"
                                    onClick={onPrev}
                                    aria-label={t('lightboxPrev')}
                                >
                                    ‹
                                </button>
                            ) : null}
                            <GalleryZoomablePhoto
                                ref={zoomRef}
                                src={current.publicUrl}
                                alt={
                                    current.uploaderName
                                        ? t('lightboxAltWithName', {
                                            name: current.uploaderName,
                                        })
                                        : t('lightboxAlt')
                                }
                                slideKey={slideEpoch}
                                dir={slideEnterDir}
                                slideReady={slideReady}
                                multi={multi}
                                onPrev={onPrev}
                                onNext={onNext}
                                onReveal={revealSlideForEpoch}
                                loadingLabel={t('lightboxImageLoading')}
                            />
                            {multi ? (
                                <button
                                    type="button"
                                    data-lightbox-interactive
                                    className="pointer-events-auto shrink-0 self-center rounded-pill bg-white/10 px-3 py-3 text-2xl text-white transition-colors hover:bg-white/20 sm:px-4"
                                    onClick={onNext}
                                    aria-label={t('lightboxNext')}
                                >
                                    ›
                                </button>
                            ) : null}
                        </div>
                        {multi ? (
                            <p
                                data-lightbox-interactive
                                className="pointer-events-auto pb-4 text-center text-small text-white/70"
                            >
                                {t('lightboxCounter', {
                                    current: (openIndex ?? 0) + 1,
                                    total: photos.length,
                                })}
                            </p>
                        ) : null}
                    </div>
                </div>
            ) : null}
        </dialog>
    )
}
