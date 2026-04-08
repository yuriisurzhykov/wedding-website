'use client'

import {
    useCallback,
    useEffect,
    useId,
    useRef,
    useState,
    type KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import {useTranslations} from 'next-intl'
import {NAV_ITEMS} from '@/lib/config/nav'
import {cn} from '@/lib/utils'
import {LanguageSwitcher} from './LanguageSwitcher'

function MenuIcon({className}: {className?: string}) {
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

function CloseIcon({className}: {className?: string}) {
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

export function Navigation() {
    const translator = useTranslations('nav')
    const [open, setOpen] = useState(false)
    const menuId = useId()
    const menuButtonRef = useRef<HTMLButtonElement>(null)
    const drawerRef = useRef<HTMLElement>(null)

    const close = useCallback(() => {
        setOpen(false)
        queueMicrotask(() => menuButtonRef.current?.focus())
    }, [])

    const scrollTo = useCallback(
        (href: string) => {
            document.querySelector(href)?.scrollIntoView({behavior: 'smooth'})
            close()
        },
        [close],
    )

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
        const firstLink = drawerRef.current?.querySelector('button')
        ;(firstLink as HTMLButtonElement | undefined)?.focus()
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
        const nodes = [...root.querySelectorAll<HTMLElement>('button:not([disabled])')]
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
                    <span className="font-accent text-xl text-primary truncate min-w-0">
                        {translator('coupleNames')}
                    </span>

                    <div className="hidden md:flex items-center gap-6">
                        {NAV_ITEMS.map((item) => (
                            <button
                                key={item.key}
                                type="button"
                                onClick={() => scrollTo(item.href)}
                                className="text-small text-text-secondary hover:text-text-primary transition-colors duration-fast"
                            >
                                {translator(item.key)}
                            </button>
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
                        {NAV_ITEMS.map((item) => (
                            <li key={item.key}>
                                <button
                                    type="button"
                                    onClick={() => scrollTo(item.href)}
                                    className={cn(
                                        'w-full rounded-md px-3 py-3 text-left text-body text-text-secondary',
                                        'hover:bg-bg-section hover:text-text-primary transition-colors duration-fast',
                                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus',
                                    )}
                                >
                                    {translator(item.key)}
                                </button>
                            </li>
                        ))}
                    </ul>
                </aside>
            </div>
        </>
    )
}
