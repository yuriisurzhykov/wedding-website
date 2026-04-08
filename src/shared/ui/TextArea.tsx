import {forwardRef, type TextareaHTMLAttributes} from 'react'

import {cn} from '@shared/lib/cn'

export const TextArea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
    ({className, ...props}, ref) => (
        <textarea
            ref={ref}
            className={cn(
                'w-full rounded-md border border-border bg-bg-card',
                'px-4 py-3 text-body text-text-primary',
                'placeholder:text-text-muted resize-none',
                'focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary',
                'transition-shadow duration-fast',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                className,
            )}
            {...props}
        />
    ),
)
TextArea.displayName = 'TextArea'
