import type {ComponentPropsWithoutRef, ReactNode} from 'react'

import {cn} from '@shared/lib/cn'

export type LabeledExternalLinkRowProps = Readonly<{
    /** Shown above the link (e.g. translated label from the parent). */
    label: ReactNode
    href: string
    /** Visible link text or content. */
    children: ReactNode
    /** Root row wrapper (stack of label + link). */
    className?: string
    /** Typography/layout for the label line; forwarded to `<p>`. */
    labelClassName?: string
    /** Base classes for `<a>`. */
    linkClassName?: string
    /** Extra attributes for `<a>` (`rel`, `target`, `aria-*`, etc.). */
    linkProps?: Omit<ComponentPropsWithoutRef<'a'>, 'href' | 'children'>
}>

/**
 * Single column block: caption line + outbound anchor (`tel:`, `mailto:`, `https:`, etc.).
 * Copy and i18n live in the caller; this component only structures markup and merges classes.
 */
export function LabeledExternalLinkRow(
    {
        label,
        href,
        children,
        className,
        labelClassName,
        linkClassName,
        linkProps,
    }: LabeledExternalLinkRowProps
) {
    return (
        <div className={cn('flex flex-col gap-2', className)}>
            <p className={labelClassName}>{label}</p>
            <a
                {...linkProps}
                href={href}
                className={cn(linkClassName, linkProps?.className)}
            >
                {children}
            </a>
        </div>
    )
}
