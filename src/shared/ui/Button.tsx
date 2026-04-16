import type {ButtonHTMLAttributes} from 'react'

import {cn} from '@shared/lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline'
type Size = 'sm' | 'md' | 'lg'

const variants: Record<Variant, string> = {
    primary:
        'bg-primary text-text-on-primary hover:bg-primary-dark shadow-button',
    secondary: 'bg-bg-section text-text-primary hover:bg-border',
    ghost: 'text-primary hover:bg-primary/10',
    outline: 'border border-primary text-primary hover:bg-primary/10',
}

const sizes: Record<Size, string> = {
    sm: 'px-4 py-2 text-small',
    md: 'px-6 py-3 text-body',
    lg: 'px-8 py-4 text-h3',
}

export function Button(
    {
        variant = 'primary',
        size = 'md',
        className,
        type = 'button',
        ...props
    }: ButtonHTMLAttributes<HTMLButtonElement> & {
        variant?: Variant
        size?: Size
    }
) {
    return (
        <button
            type={type}
            className={cn(
                'rounded-pill font-body font-medium',
                'transition-[background-color,transform,opacity] duration-fast',
                'active:scale-95',
                'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
                variants[variant],
                sizes[size],
                className,
            )}
            {...props}
        />
    )
}
