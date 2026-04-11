'use client'

import {
    isFeatureEnabled,
    isFeatureHidden,
    type SiteCapabilityKey,
} from '@entities/site-settings'
import type {ReactNode} from 'react'

import {useSiteCapabilities} from './SiteCapabilitiesProvider'

type Props = Readonly<{
    capability: SiteCapabilityKey
    children: ReactNode
    /** Shown when the feature is `preview` (teaser / unavailable copy). Omit to render nothing in preview. */
    preview?: ReactNode
}>

/**
 * Client gate for feature visibility: `hidden` → `null`; `preview` → {@link preview} or nothing; `enabled` →
 * {@link children}. Pair with server-side `notFound` / conditional RSC for dedicated routes.
 */
export function FeatureGate({capability, children, preview}: Props) {
    const {capabilities} = useSiteCapabilities()
    const state = capabilities[capability]
    if (isFeatureHidden(state)) {
        return null
    }
    if (!isFeatureEnabled(state)) {
        return <>{preview ?? null}</>
    }
    return <>{children}</>
}
