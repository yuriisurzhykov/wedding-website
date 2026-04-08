'use client'

import {useEffect, useRef} from 'react'
import {useTranslations} from 'next-intl'

import type {GalleryPhotoView} from '@entities/photo'
import {cn} from '@shared/lib/cn'

type GalleryLightboxProps = {
    photos: GalleryPhotoView[]
    openIndex: number | null
    onClose: () => void
    onPrev: () => void
    onNext: () => void
}

/**
 * Full-screen viewer: native `<dialog>` (focus trap, Escape), prev/next, backdrop click to close.
 */
export function GalleryLightbox({
    photos,
    openIndex,
    onClose,
    onPrev,
    onNext,
}: GalleryLightboxProps) {
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

    return (
        <dialog
            ref={dialogRef}
            className={cn(
                'fixed inset-0 z-[100] m-0 h-full max-h-none w-full max-w-none border-0 bg-transparent p-0',
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
                <div className="relative flex h-[100dvh] max-h-[100dvh] w-full flex-col">
                    <button
                        type="button"
                        className="absolute inset-0 z-0 bg-black/85"
                        aria-hidden="true"
                        tabIndex={-1}
                        onClick={() => dialogRef.current?.close()}
                    />
                    <div className="pointer-events-none relative z-10 flex min-h-0 flex-1 flex-col">
                        <div className="pointer-events-auto flex shrink-0 justify-end p-3 sm:p-4">
                            <button
                                type="button"
                                className="rounded-pill bg-white/10 px-4 py-2 text-body text-white transition-colors hover:bg-white/20"
                                onClick={() => dialogRef.current?.close()}
                            >
                                {t('lightboxClose')}
                            </button>
                        </div>
                        <div className="pointer-events-auto flex min-h-0 flex-1 items-stretch justify-center gap-2 px-2 pb-4 sm:gap-4 sm:px-6">
                            {multi ? (
                                <button
                                    type="button"
                                    className="shrink-0 self-center rounded-pill bg-white/10 px-3 py-3 text-2xl text-white transition-colors hover:bg-white/20 sm:px-4"
                                    onClick={onPrev}
                                    aria-label={t('lightboxPrev')}
                                >
                                    ‹
                                </button>
                            ) : null}
                            <div className="relative min-h-0 min-w-0 max-w-full flex-1">
                                {/* eslint-disable-next-line @next/next/no-img-element -- R2 public URLs */}
                                <img
                                    src={current.publicUrl}
                                    alt={
                                        current.uploaderName
                                            ? t('lightboxAltWithName', {
                                                  name: current.uploaderName,
                                              })
                                            : t('lightboxAlt')
                                    }
                                    className="absolute inset-0 m-auto max-h-full max-w-full object-contain"
                                />
                            </div>
                            {multi ? (
                                <button
                                    type="button"
                                    className="shrink-0 self-center rounded-pill bg-white/10 px-3 py-3 text-2xl text-white transition-colors hover:bg-white/20 sm:px-4"
                                    onClick={onNext}
                                    aria-label={t('lightboxNext')}
                                >
                                    ›
                                </button>
                            ) : null}
                        </div>
                        {multi ? (
                            <p className="pointer-events-auto pb-4 text-center text-small text-white/70">
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
