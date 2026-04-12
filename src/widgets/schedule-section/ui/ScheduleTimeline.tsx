'use client'

import {useLayoutEffect, useRef, useState} from 'react'
import {useTranslations} from 'next-intl'

import {cn} from '@shared/lib/cn'
import {getScheduleIcon} from '@shared/ui/icons/schedule'
import {type ScheduleItem, formatScheduleClock} from '@shared/lib/wedding-calendar'

type Props = Readonly<{
    items: ScheduleItem[]
    locale: string
}>

export function ScheduleTimeline({items, locale}: Props) {
    const t = useTranslations()
    const containerRef = useRef<HTMLDivElement>(null)
    const iconRefs = useRef<(HTMLDivElement | null)[]>([])
    const [splitPx, setSplitPx] = useState<number | null>(null)

    const emphasisIndex = items.findIndex((row) => row.emphasis)

    useLayoutEffect(() => {
        const container = containerRef.current
        if (!container) return

        const measure = () => {
            if (emphasisIndex < 0) {
                setSplitPx(null)
                return
            }
            const iconEl = iconRefs.current[emphasisIndex]
            if (!iconEl) {
                setSplitPx(null)
                return
            }
            const c = container.getBoundingClientRect()
            const ir = iconEl.getBoundingClientRect()
            const centerY = ir.top + ir.height / 2 - c.top
            setSplitPx(Math.max(0, centerY))
        }

        measure()
        const ro = new ResizeObserver(measure)
        ro.observe(container)
        window.addEventListener('resize', measure)
        return () => {
            ro.disconnect()
            window.removeEventListener('resize', measure)
        }
    }, [items, emphasisIndex])

    const showSplit = emphasisIndex >= 0 && splitPx !== null

    return (
        <div ref={containerRef} className="relative mx-auto max-w-2xl">
            {!showSplit ? (
                <div className="pointer-events-none absolute top-0 bottom-0 left-8 w-px bg-border" aria-hidden/>
            ) : (
                <>
                    <div
                        className="pointer-events-none absolute left-8 top-0 w-0 border-l border-dashed border-border"
                        style={{height: splitPx}}
                        aria-hidden
                    />
                    <div
                        className="pointer-events-none absolute bottom-0 left-8 w-0 border-l-2 border-solid border-primary"
                        style={{top: splitPx}}
                        aria-hidden
                    />
                </>
            )}

            <div className="relative z-10 flex flex-col gap-8">
                {items.map((item, index) => {
                    const Icon = getScheduleIcon(item.iconId)
                    const isEmphasis = item.emphasis
                    return (
                        <div key={item.id} className="flex items-start gap-6">
                            <div
                                ref={(el) => {
                                    iconRefs.current[index] = el
                                }}
                                className={cn(
                                    'relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-pill border-2 bg-bg-card text-primary shadow-sm',
                                    isEmphasis
                                        ? 'border-primary ring-2 ring-primary/30 ring-offset-2 ring-offset-bg-card'
                                        : 'border-border',
                                )}
                                aria-hidden
                            >
                                <Icon className="h-8 w-8"/>
                            </div>

                            <div className="flex-1 pt-2 pb-6">
                                {isEmphasis ? (
                                    <p className="mb-2 inline-block rounded-pill border border-primary/40 bg-bg-card px-3 py-1 font-mono text-small font-medium uppercase tracking-wide text-primary">
                                        {t('schedule.emphasisBadge')}
                                    </p>
                                ) : null}
                                <div className="mb-1 flex flex-wrap items-baseline gap-3">
                                    <span className="font-mono text-small font-medium text-primary">
                                        {formatScheduleClock(locale, item.hour, item.minute)}
                                    </span>
                                    <h3 className="font-display text-h3 text-text-primary">{t(item.titleKey)}</h3>
                                </div>
                                <p className="text-body text-text-secondary">{t(item.descKey)}</p>
                                {item.location && item.locationUrl ? (
                                    <a
                                        href={item.locationUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-2 inline-flex items-center gap-1 text-small text-primary transition-colors hover:text-primary-dark"
                                    >
                                        <span aria-hidden>📍</span>
                                        {item.location}
                                    </a>
                                ) : null}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
