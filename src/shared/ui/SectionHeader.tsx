import {cn} from '@shared/lib/cn'

export function SectionHeader({
                                  title,
                                  subtitle,
                                  centered = true,
                                  className,
                              }: {
    title: string
    subtitle?: string
    centered?: boolean
    className?: string
}) {
    return (
        <div className={cn('mb-12', centered && 'text-center', className)}>
            <h2 className="font-display text-h2 text-text-primary mb-3">{title}</h2>
            {subtitle && (
                <p className="text-text-secondary text-body max-w-(--content-width) mx-auto">
                    {subtitle}
                </p>
            )}
            <div className="flex items-center justify-center gap-3 mt-6">
                <div className="h-px w-16 bg-border"/>
                <div className="w-1.5 h-1.5 rounded-pill bg-primary" aria-hidden/>
                <div className="h-px w-16 bg-border"/>
            </div>
        </div>
    )
}
