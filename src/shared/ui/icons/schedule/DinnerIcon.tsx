import type { SVGProps } from 'react'

/**
 * Cloche on a tray with fork and knife — dining — decorative schedule icon.
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
            {/* Outer ring */}
            <circle cx="12" cy="12" r="11" />

            {/* Fork */}
            {/* U-shape base and outer tines */}
            <path d="M 2.5 6 V 8.5 A 1.5 1.5 0 0 0 5.5 8.5 V 6" />
            {/* Middle tine and handle */}
            <path d="M 4 6 V 17" />

            {/* Cloche */}
            {/* Platter base */}
            <rect x="7" y="15" width="10" height="1.5" rx="0.75" />
            {/* Dome */}
            <path d="M 7.5 15 A 4.5 4.5 0 0 1 16.5 15" />
            {/* Knob */}
            <circle cx="12" cy="9" r="1.5" />

            {/* Knife */}
            <path d="M 21 17 V 6.5 C 21 5.5 19 5.5 19 7 V 11 C 19 12 19.5 12.5 19.5 13.5 V 17 C 19.5 18 21 18 21 17 Z" />
        </svg>
    )
}