'use client'

import {publicSiteSettingsApiSuccessSchema, type SiteCapabilities} from '@entities/site-settings'
import {
    createContext,
    type ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'

export const SITE_SETTINGS_PUBLIC_API_PATH = '/api/site-settings/public'

export type SiteCapabilitiesContextValue = {
    capabilities: SiteCapabilities
    updatedAt: string
    /** Fetches latest snapshot from {@link SITE_SETTINGS_PUBLIC_API_PATH}. */
    refresh: () => Promise<void>
}

const SiteCapabilitiesContext = createContext<SiteCapabilitiesContextValue | null>(null)

type Props = Readonly<{
    initialCapabilities: SiteCapabilities
    initialUpdatedAt: string
    children: ReactNode
}>

/**
 * Holds the live capabilities snapshot for client islands. Initial values match RSC; refetches on window focus and tab
 * visibility so admin toggles can unmount gated features without a full reload.
 */
export function SiteCapabilitiesProvider({
    initialCapabilities,
    initialUpdatedAt,
    children,
}: Props) {
    const [capabilities, setCapabilities] = useState(initialCapabilities)
    const [updatedAt, setUpdatedAt] = useState(initialUpdatedAt)

    const refresh = useCallback(async () => {
        let res: Response
        try {
            res = await fetch(SITE_SETTINGS_PUBLIC_API_PATH, {
                cache: 'no-store',
                credentials: 'same-origin',
            })
        } catch {
            return
        }
        const data: unknown = await res.json().catch(() => null)
        const parsed = publicSiteSettingsApiSuccessSchema.safeParse(data)
        if (!res.ok || !parsed.success) {
            return
        }
        setCapabilities(parsed.data.capabilities)
        setUpdatedAt(parsed.data.updated_at)
    }, [])

    const lastRefreshRef = useRef(0)

    const throttledRefresh = useCallback(() => {
        const now = Date.now()
        if (now - lastRefreshRef.current < 30_000) return
        lastRefreshRef.current = now
        void refresh()
    }, [refresh])

    useEffect(() => {
        const onVisible = () => {
            if (document.visibilityState === 'visible') {
                throttledRefresh()
            }
        }
        const onFocus = () => {
            throttledRefresh()
        }
        document.addEventListener('visibilitychange', onVisible)
        window.addEventListener('focus', onFocus)
        return () => {
            document.removeEventListener('visibilitychange', onVisible)
            window.removeEventListener('focus', onFocus)
        }
    }, [throttledRefresh])

    const value = useMemo(
        () => ({capabilities, updatedAt, refresh}),
        [capabilities, updatedAt, refresh],
    )

    return (
        <SiteCapabilitiesContext.Provider value={value}>{children}</SiteCapabilitiesContext.Provider>
    )
}

export function useSiteCapabilities(): SiteCapabilitiesContextValue {
    const ctx = useContext(SiteCapabilitiesContext)
    if (!ctx) {
        throw new Error('useSiteCapabilities must be used within SiteCapabilitiesProvider')
    }
    return ctx
}
