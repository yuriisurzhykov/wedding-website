'use client'

import Image from 'next/image'
import {useCallback, useEffect, useRef, useState} from 'react'
import {useTranslations} from 'next-intl'

import type {GalleryPhotoView} from '@entities/photo'
import {cn} from '@shared/lib/cn'
import {PhotoUploader} from '@shared/ui'

import {GalleryLightbox} from './GalleryLightbox'

type GalleryPhotosClientProps = {
    initialPhotos: GalleryPhotoView[]
}

async function fetchGalleryPhotos(): Promise<GalleryPhotoView[] | null> {
    const res = await fetch('/api/gallery/photos', {cache: 'no-store'})
    if (!res.ok) {
        return null
    }
    const data = (await res.json()) as {photos?: GalleryPhotoView[]}
    return data.photos ?? null
}

/**
 * Client island: upload, refetch list from API after success, thumbnails + lightbox.
 */
export function GalleryPhotosClient({initialPhotos}: GalleryPhotosClientProps) {
    const t = useTranslations('gallery')
    const serverSigRef = useRef(initialPhotos.map((p) => p.id).join(','))
    const [photos, setPhotos] = useState<GalleryPhotoView[]>(initialPhotos)
    const [openIndex, setOpenIndex] = useState<number | null>(null)

    useEffect(() => {
        const nextSig = initialPhotos.map((p) => p.id).join(',')
        if (nextSig !== serverSigRef.current) {
            serverSigRef.current = nextSig
            setPhotos(initialPhotos)
        }
    }, [initialPhotos])

    const refetchPhotos = useCallback(async () => {
        const next = await fetchGalleryPhotos()
        if (next) {
            setPhotos(next)
            serverSigRef.current = next.map((p) => p.id).join(',')
        }
    }, [])

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

    return (
        <>
            <PhotoUploader onUploadSuccess={refetchPhotos}/>
            {photos.length === 0 ? (
                <p className="mt-10 text-center text-body text-text-secondary">
                    {t('empty')}
                </p>
            ) : (
                <ul
                    className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4"
                    aria-label={t('gridLabel')}
                >
                    {photos.map((p, i) => (
                        <li
                            key={p.id}
                            className="min-h-px [contain-intrinsic-size:12rem_12rem] [content-visibility:auto]"
                        >
                            <button
                                type="button"
                                className={cn(
                                    'group relative aspect-square w-full overflow-hidden rounded-card bg-bg-section shadow-card',
                                    'ring-offset-2 transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                                )}
                                onClick={() => setOpenIndex(i)}
                                aria-label={t('openPhotoAria', {
                                    current: i + 1,
                                    total: photos.length,
                                })}
                            >
                                <Image
                                    src={p.publicUrl}
                                    alt=""
                                    fill
                                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 34vw, 25vw"
                                    className="object-cover transition-transform duration-fast motion-reduce:transition-none group-hover:scale-[1.02] motion-reduce:group-hover:scale-100"
                                    priority={i < 6}
                                    quality={75}
                                />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
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
