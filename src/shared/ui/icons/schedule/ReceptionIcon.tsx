import type {SVGProps} from 'react'

/**
 * Car / travel to venue — decorative schedule icon.
 */
export function ReceptionIcon(props: SVGProps<SVGSVGElement>) {
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
            <path d="M5 17H19L17.5 11H6.5L5 17Z"/>
            <path d="M3 17H21"/>
            <circle cx="7.5" cy="17" r="1.5"/>
            <circle cx="16.5" cy="17" r="1.5"/>
            <path d="M6.5 11L7 8H10"/>
        </svg>
    )
}
