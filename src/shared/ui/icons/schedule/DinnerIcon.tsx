import type {SVGProps} from 'react'

/**
 * Two stemmed glasses — celebration dinner — decorative schedule icon.
 */
export function DinnerIcon(props: SVGProps<SVGSVGElement>) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
            {...props}
        >
            <path d="M5 5L7.5 14H10L7 5H5Z"/>
            <path d="M8.5 14V19"/>
            <path d="M6.5 21H11"/>
            <path d="M19 5L16.5 14H14L17 5H19Z"/>
            <path d="M15.5 14V19"/>
            <path d="M13 21H17.5"/>
            <path d="M10.5 4.5L13.5 4.5"/>
        </svg>
    )
}
