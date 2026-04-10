import type {SVGProps} from 'react'

/**
 * Interlocking rings — ceremony — decorative schedule icon.
 */
export function CeremonyIcon(props: SVGProps<SVGSVGElement>) {
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
            <ellipse cx="9" cy="12" rx="4" ry="6" transform="rotate(-20 9 12)"/>
            <ellipse cx="15" cy="12" rx="4" ry="6" transform="rotate(20 15 12)"/>
        </svg>
    )
}
