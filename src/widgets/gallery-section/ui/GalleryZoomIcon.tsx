'use client'

import {cn} from '@shared/lib/cn'

type GalleryZoomIconProps = {
    className?: string
}

/** Magnifier-with-plus icon for the lightbox zoom toggle. */
export function GalleryZoomIcon({className}: GalleryZoomIconProps) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn('size-5 shrink-0', className)}
            aria-hidden
        >
            <circle cx="11" cy="11" r="7"/>
            <path d="M21 21l-4.3-4.3"/>
            <path d="M11 8v6"/>
            <path d="M8 11h6"/>
        </svg>
    )
}
