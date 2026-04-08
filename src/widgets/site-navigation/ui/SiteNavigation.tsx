'use client'

import {type KeyboardEvent as ReactKeyboardEvent, useCallback, useEffect, useId, useRef, useState,} from 'react'
import {useTranslations} from 'next-intl'

import {usePathname} from '@/i18n/navigation'
import {SITE_NAV_REGISTRY} from '@entities/site-nav'
import {cn} from '@shared/lib/cn'
import {LanguageSwitcher} from '@shared/ui'

import {SiteNavRegistryEntryControl} from './SiteNavRegistryEntryControl'

function MenuIcon({className}: { className?: string }) {
    return (
        <svg
            className={className}
            width={24}
            height={24}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
        >
            <path
                d="M4 7h16M4 12h16M4 17h16"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
            />
        </svg>
    )
}

function CloseIcon({className}: { className?: string }) {
    return (
        <svg
            className={className}
            width={24}
            height={24}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
        >
            <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
            />
        </svg>
    )
}

export function SiteNavigation() {
    const translator = useTranslations('nav')
    const pathname = usePathname()
    const onHome = pathname === '/'
    const [open, setOpen] = useState(false)
    const menuId = useId()
    const menuButtonRef = useRef<HTMLButtonElement>(null)
    const drawerRef = useRef<HTMLElement>(null)

    const close = useCallback(() => {
        setOpen(false)
        queueMicrotask(() => menuButtonRef.current?.focus())
    }, [])

    const scrollToSectionId = useCallback(
        (sectionId: string) => {
            document
                .querySelector(`#${sectionId}`)
                ?.scrollIntoView({behavior: 'smooth'})
            close()
        },
        [close],
    )

    const scrollToTop = useCallback(() => {
        window.scrollTo({top: 0, behavior: 'smooth'})
        close()
    }, [close])

    const hashScrollCleanupRef = useRef<(() => void) | undefined>(undefined)

    const runHomeHashScroll = useCallback(() => {
        hashScrollCleanupRef.current?.()
        const raw =
            typeof window !== 'undefined' ? window.location.hash.slice(1) : ''
        if (!raw) {
            return
        }

        let cancelled = false
        let rafId = 0
        let attempts = 0
        /** Home sections can mount after RSC/streaming; retry until the anchor exists. */
        const maxAttempts = 240

        const tick = () => {
            if (cancelled) {
                return
            }
            const el = document.getElementById(raw)
            if (el) {
                el.scrollIntoView({behavior: 'smooth'})
                return
            }
            attempts += 1
            if (attempts >= maxAttempts) {
                return
            }
            rafId = requestAnimationFrame(tick)
        }

        rafId = requestAnimationFrame(tick)

        hashScrollCleanupRef.current = () => {
            cancelled = true
            cancelAnimationFrame(rafId)
            hashScrollCleanupRef.current = undefined
        }
    }, [])

    useEffect(() => {
        if (pathname !== '/') {
            hashScrollCleanupRef.current?.()
            return
        }
        runHomeHashScroll()
        return () => {
            hashScrollCleanupRef.current?.()
        }
    }, [pathname, runHomeHashScroll])

    useEffect(() => {
        if (pathname !== '/') {
            return
        }
        const onHashChange = () => {
            runHomeHashScroll()
        }
        window.addEventListener('hashchange', onHashChange)
        return () => window.removeEventListener('hashchange', onHashChange)
    }, [pathname, runHomeHashScroll])

    useEffect(() => {
        if (!open) {
            return
        }
        const prevOverflow = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                close()
            }
        }
        document.addEventListener('keydown', onKeyDown)
        const firstFocusable = drawerRef.current?.querySelector<HTMLElement>(
            'button:not([disabled]), a[href]',
        )
        firstFocusable?.focus()
        return () => {
            document.body.style.overflow = prevOverflow
            document.removeEventListener('keydown', onKeyDown)
        }
    }, [open, close])

    function handleDrawerKeyDown(e: ReactKeyboardEvent<HTMLElement>) {
        if (e.key !== 'Tab' || !drawerRef.current) {
            return
        }
        const root = drawerRef.current
        const nodes = [
            ...root.querySelectorAll<HTMLElement>(
                'button:not([disabled]), a[href]',
            ),
        ]
        if (nodes.length === 0) {
            return
        }
        const first = nodes[0]
        const last = nodes[nodes.length - 1]
        if (e.shiftKey) {
            if (document.activeElement === first) {
                e.preventDefault()
                last.focus()
            }
        } else if (document.activeElement === last) {
            e.preventDefault()
            first.focus()
        }
    }

    return (
        <>
            <nav
                className="fixed top-0 left-0 right-0 z-[60] bg-bg-card/80 backdrop-blur-md border-b border-border"
                aria-label={translator('mainNav')}
            >
                <div className="max-w-(--max-width) mx-auto px-4 h-16 flex items-center justify-between gap-3 min-w-0">
                    <button
                        type="button"
                        onClick={scrollToTop}
                        aria-label={translator('scrollToTop')}
                        className={cn(
                            'font-accent text-xl text-primary truncate min-w-0 text-left',
                            'rounded-md transition-opacity duration-fast hover:opacity-90',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2',
                        )}
                    >
                        {translator('coupleNames')}
                    </button>

                    <div className="hidden md:flex items-center gap-6">
                        {SITE_NAV_REGISTRY.map((item) => (
                            <SiteNavRegistryEntryControl
                                key={item.navKey}
                                item={item}
                                layout="bar"
                                onHome={onHome}
                                label={translator(item.navKey)}
                                scrollToSectionId={scrollToSectionId}
                                closeDrawer={close}
                            />
                        ))}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <LanguageSwitcher/>
                        <button
                            ref={menuButtonRef}
                            type="button"
                            className={cn(
                                'md:hidden flex h-11 w-11 items-center justify-center rounded-md',
                                'text-text-primary border border-border bg-bg-card/90',
                                'hover:bg-primary-light/30 transition-colors duration-fast',
                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2',
                            )}
                            aria-expanded={open}
                            aria-controls={menuId}
                            aria-label={open ? translator('closeMenu') : translator('openMenu')}
                            onClick={() => setOpen((v) => !v)}
                        >
                            {open ? <CloseIcon/> : <MenuIcon/>}
                        </button>
                    </div>
                </div>
            </nav>

            <div className="md:hidden" aria-hidden={!open}>
                <button
                    type="button"
                    className={cn(
                        'fixed left-0 right-0 top-16 bottom-0 z-[50] bg-text-primary/35 transition-opacity duration-fast',
                        open ? 'opacity-100' : 'opacity-0 pointer-events-none',
                    )}
                    aria-hidden
                    tabIndex={-1}
                    onClick={close}
                />

                <aside
                    ref={drawerRef}
                    id={menuId}
                    role="dialog"
                    aria-modal="true"
                    aria-label={translator('mainNav')}
                    inert={!open}
                    onKeyDown={handleDrawerKeyDown}
                    className={cn(
                        'fixed top-16 right-0 bottom-0 z-[55] flex w-[min(20rem,calc(100vw-1rem))] flex-col',
                        'border-l border-border bg-bg-card shadow-modal',
                        'transition-transform duration-200 ease-out motion-reduce:transition-none',
                        open ? 'translate-x-0' : 'translate-x-full pointer-events-none',
                    )}
                >
                    <ul className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
                        {SITE_NAV_REGISTRY.map((item) => (
                            <li key={item.navKey}>
                                <SiteNavRegistryEntryControl
                                    item={item}
                                    layout="drawer"
                                    onHome={onHome}
                                    label={translator(item.navKey)}
                                    scrollToSectionId={scrollToSectionId}
                                    closeDrawer={close}
                                />
                            </li>
                        ))}
                    </ul>
                </aside>
            </div>
        </>
    )
}
