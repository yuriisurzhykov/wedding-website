import type {SVGProps} from 'react'

/**
 * Classical building / welcome — decorative schedule icon.
 */
export function GatheringIcon(props: SVGProps<SVGSVGElement>) {
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
            <path d="M4 10V20H20V10"/>
            <path d="M2 10L12 4L22 10"/>
            <path d="M9 20V14H15V20"/>
            <path d="M7 14H17"/>
        </svg>
    )
}
