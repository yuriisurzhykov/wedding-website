'use client'

import {usePathname, useSearchParams} from 'next/navigation'
import {useCallback, useEffect, useRef, useState} from 'react'

import {cn} from '@shared/lib/cn'

/**
 * Thin top progress line for same-origin navigations (App Router has no router.events).
 * Starts on internal link click; completes when the URL pathname/search updates.
 */
export function NavigationProgressBar() {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const search = searchParams?.toString() ?? ''

    const [active, setActive] = useState(false)
    const [widthPct, setWidthPct] = useState(0)
    const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const pendingNavRef = useRef(false)
    const skipPathEffectRef = useRef(true)

    const pathKey = `${pathname}?${search}`

    const clearTick = useCallback(() => {
        if (tickRef.current) {
            clearInterval(tickRef.current)
            tickRef.current = null
        }
    }, [])

    useEffect(() => {
        if (skipPathEffectRef.current) {
            skipPathEffectRef.current = false
            return
        }
        if (!pendingNavRef.current) {
            return
        }
        pendingNavRef.current = false
        clearTick()
        const completeId = window.setTimeout(() => {
            setWidthPct(100)
        }, 0)
        const hideId = window.setTimeout(() => {
            setActive(false)
            setWidthPct(0)
        }, 220)
        return () => {
            window.clearTimeout(completeId)
            window.clearTimeout(hideId)
        }
    }, [pathKey, clearTick])

    useEffect(() => {
        const onClickCapture = (event: MouseEvent) => {
            if (event.defaultPrevented || event.button !== 0) {
                return
            }
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
                return
            }
            const el = (event.target as HTMLElement | null)?.closest?.('a[href]')
            if (!el) {
                return
            }
            const a = el as HTMLAnchorElement
            if (a.target === '_blank' || a.hasAttribute('download')) {
                return
            }
            const raw = a.getAttribute('href')
            if (!raw || raw.startsWith('#')) {
                return
            }
            let url: URL
            try {
                url = new URL(raw, window.location.origin)
            } catch {
                return
            }
            if (url.origin !== window.location.origin) {
                return
            }
            const next = `${url.pathname}${url.search}`
            const current = `${window.location.pathname}${window.location.search}`
            if (next === current) {
                return
            }

            pendingNavRef.current = true
            clearTick()
            setActive(true)
            setWidthPct(8)
            tickRef.current = setInterval(() => {
                setWidthPct((w) => (w < 88 ? w + 6 + Math.random() * 4 : w))
            }, 320)
        }

        document.addEventListener('click', onClickCapture, true)
        return () => {
            document.removeEventListener('click', onClickCapture, true)
            clearTick()
        }
    }, [clearTick])

    return (
        <div
            className={cn(
                'pointer-events-none fixed top-0 left-0 right-0 z-[70] h-[3px] overflow-hidden',
                !active && widthPct === 0 && 'opacity-0',
            )}
            aria-hidden
        >
            <div
                className={cn(
                    'h-full bg-primary shadow-button origin-left transition-[width] duration-fast ease-out',
                    widthPct >= 100 ? 'duration-200' : 'duration-300',
                )}
                style={{width: `${widthPct}%`}}
            />
        </div>
    )
}
