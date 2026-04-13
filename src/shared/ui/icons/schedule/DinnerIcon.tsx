import type {SVGProps} from 'react'

/**
 * Covered dish centered with fork and knife — dining — decorative schedule icon.
 * Utensils use simple strokes so the mark stays readable at small sizes.
 * Artwork is scaled up inside the 24×24 viewBox so the mark reads larger at the same CSS size.
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
            <g transform="translate(12 12) scale(1.1) translate(-12 -12)">
                {/* Fork (left) */}
                <path d="M3.5 5.5v2.5 M4.25 5.5v2.5 M5 5.5v2.5 M4.25 8v10" />
                {/* Cloche — centered */}
                <path d="M8 17.5C8 9.5 16 9.5 16 17.5" />
                <circle cx="12" cy="11" r="1.35" />
                <path d="M7.5 18.5h9" />
                {/* Knife (right) */}
                <path d="M19.5 5.5l2.25 4.25v6.25L19.5 18" />
            </g>
        </svg>
    )
}
