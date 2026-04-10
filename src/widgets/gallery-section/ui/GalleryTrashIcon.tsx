'use client'

import {cn} from '@shared/lib/cn'

type GalleryTrashIconProps = {
    className?: string
}

/**
 * Trash icon for gallery delete controls; parent should be `group` — wiggle on `group-hover`.
 */
export function GalleryTrashIcon({className}: GalleryTrashIconProps) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn(
                'size-5 shrink-0 motion-safe:group-hover:[animation:gallery-trash-wiggle_0.65s_ease-in-out_infinite] motion-reduce:group-hover:[animation:none]',
                className,
            )}
            aria-hidden
        >
            <path d="M3 6h18"/>
            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
            <path d="M10 11v6"/>
            <path d="M14 11v6"/>
        </svg>
    )
}
