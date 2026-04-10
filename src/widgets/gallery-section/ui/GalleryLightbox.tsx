'use client'

import Image from 'next/image'
import {useCallback, useEffect, useRef} from 'react'
import {useTranslations} from 'next-intl'

import type {GalleryPhotoView} from '@entities/photo'
import {cn} from '@shared/lib/cn'

import {GalleryTrashIcon} from './GalleryTrashIcon'

/** Horizontal distance (px) before a drag counts as prev/next. */
const LIGHTBOX_SWIPE_THRESHOLD_PX = 50

/**
 * Viewport rectangle of the painted bitmap for `object-fit: contain` inside a box
 * with natural size `nw`×`nh`.
 */
function getObjectContainPaintedRectViewport(
    containerViewport: DOMRectReadOnly,
    nw: number,
    nh: number,
): {left: number; top: number; right: number; bottom: number} {
    if (nw <= 0 || nh <= 0) {
        const {left, top, right, bottom} = containerViewport
        return {left, top, right, bottom}
    }
    const W = containerViewport.width
    const H = containerViewport.height
    const scale = Math.min(W / nw, H / nh)
    const dispW = nw * scale
    const dispH = nh * scale
    const left = containerViewport.left + (W - dispW) / 2
    const top = containerViewport.top + (H - dispH) / 2
    return {
        left,
        top,
        right: left + dispW,
        bottom: top + dispH,
    }
}

function isPointInsideRect(
    x: number,
    y: number,
    r: {left: number; top: number; right: number; bottom: number},
): boolean {
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom
}

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
 * Tap outside the **painted** image (`object-contain` letterboxing, margins, chrome) closes;
 * tap on the bitmap does not.
 *
 * Touch/pointer on the photo area: swipe **left** → `onNext`, swipe **right** → `onPrev`
 * (same as ArrowRight / ArrowLeft). Vertical intent is ignored when horizontal delta dominates.
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
    const dialogRef = useRef<HTMLDialogElement>(null)

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

    const photoColumnRef = useRef<HTMLDivElement>(null)
    const photoImgRef = useRef<HTMLImageElement | null>(null)

    const swipePointerRef = useRef<{
        id: number
        x: number
        y: number
    } | null>(null)

    const handleSwipePointerDown = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            if (!multi || e.button !== 0) {
                return
            }
            swipePointerRef.current = {
                id: e.pointerId,
                x: e.clientX,
                y: e.clientY,
            }
            e.currentTarget.setPointerCapture(e.pointerId)
        },
        [multi],
    )

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

    const handlePhotoColumnClick = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            const column = photoColumnRef.current
            const img = photoImgRef.current
            if (!column || !img?.naturalWidth || !img.naturalHeight) {
                return
            }
            const painted = getObjectContainPaintedRectViewport(
                column.getBoundingClientRect(),
                img.naturalWidth,
                img.naturalHeight,
            )
            if (isPointInsideRect(e.clientX, e.clientY, painted)) {
                e.stopPropagation()
            }
        },
        [],
    )

    const handleSwipePointerUpOrCancel = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            const tracked = swipePointerRef.current
            if (!multi || !tracked || tracked.id !== e.pointerId) {
                return
            }
            swipePointerRef.current = null
            try {
                e.currentTarget.releasePointerCapture(e.pointerId)
            } catch {
                /* already released */
            }
            const dx = e.clientX - tracked.x
            const dy = e.clientY - tracked.y
            if (Math.abs(dx) < LIGHTBOX_SWIPE_THRESHOLD_PX) {
                return
            }
            if (Math.abs(dx) <= Math.abs(dy)) {
                return
            }
            if (dx < 0) {
                onNext()
            } else {
                onPrev()
            }
        },
        [multi, onNext, onPrev],
    )

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
                            <div
                                ref={photoColumnRef}
                                className={cn(
                                    'pointer-events-auto relative min-h-0 min-w-0 max-w-full flex-1 touch-pan-y',
                                    multi ? 'select-none' : null,
                                )}
                                onClick={handlePhotoColumnClick}
                                onPointerDown={multi ? handleSwipePointerDown : undefined}
                                onPointerUp={
                                    multi ? handleSwipePointerUpOrCancel : undefined
                                }
                                onPointerCancel={
                                    multi ? handleSwipePointerUpOrCancel : undefined
                                }
                            >
                                <Image
                                    ref={photoImgRef}
                                    src={current.publicUrl}
                                    alt={
                                        current.uploaderName
                                            ? t('lightboxAltWithName', {
                                                name: current.uploaderName,
                                            })
                                            : t('lightboxAlt')
                                    }
                                    fill
                                    sizes="100vw"
                                    priority
                                    quality={80}
                                    className="object-contain object-center"
                                />
                            </div>
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
