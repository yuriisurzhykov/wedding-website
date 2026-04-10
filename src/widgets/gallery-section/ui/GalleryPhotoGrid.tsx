'use client'

import Image from 'next/image'
import {useTranslations} from 'next-intl'

import type {GalleryPhotoView} from '@entities/photo'
import {cn} from '@shared/lib/cn'

import {GalleryTrashIcon} from './GalleryTrashIcon'

type GalleryPhotoGridProps = {
    className?: string
    onOpenPhoto: (index: number) => void
    onRequestDelete?: (photoId: string) => void
    photos: GalleryPhotoView[]
}

export function GalleryPhotoGrid({
                                     photos,
                                     onOpenPhoto,
                                     onRequestDelete,
                                     className,
                                 }: GalleryPhotoGridProps) {
    const t = useTranslations('gallery')

    return (
        <ul
            className={cn(
                'mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4',
                className,
            )}
            aria-label={t('gridLabel')}
        >
            {photos.map((p, i) => (
                <li
                    key={p.id}
                    className="min-h-px [contain-intrinsic-size:12rem_12rem] [content-visibility:auto]"
                >
                    <div
                        className={cn(
                            'group/card relative aspect-square w-full overflow-hidden rounded-card bg-bg-section shadow-card',
                            'ring-offset-2 transition-shadow focus-within:ring-2 focus-within:ring-primary',
                        )}
                    >
                        <button
                            type="button"
                            className={cn(
                                'group absolute inset-0 z-0',
                                'ring-offset-2 transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                            )}
                            onClick={() => onOpenPhoto(i)}
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
                        {p.canDelete && onRequestDelete ? (
                            <button
                                type="button"
                                className={cn(
                                    'absolute bottom-2 right-2 z-10 flex h-10 w-10 items-center justify-center rounded-full',
                                    'bg-black/55 text-text-on-primary shadow-card ring-1 ring-white/25',
                                    'opacity-100 transition-opacity duration-fast motion-reduce:transition-none',
                                    'sm:opacity-0 sm:group-hover/card:opacity-100 sm:focus-visible:opacity-100',
                                )}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onRequestDelete(p.id)
                                }}
                                aria-label={t('deletePhotoAria')}
                            >
                                <GalleryTrashIcon className="text-text-on-primary"/>
                            </button>
                        ) : null}
                    </div>
                </li>
            ))}
        </ul>
    )
}
