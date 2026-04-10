'use client'

import type {SiteCapabilityKey} from '@entities/site-settings'
import type {ReactNode} from 'react'

import {useSiteCapabilities} from './SiteCapabilitiesProvider'

type Props = Readonly<{
    capability: SiteCapabilityKey
    children: ReactNode
}>

/**
 * Client gate: when {@link capability} is false in the live snapshot, returns `null` so descendants unmount (no upload /
 * wish form islands). Pair with server-side conditional render on RSC for first paint when the feature starts disabled.
 */
export function FeatureGate({capability, children}: Props) {
    const {capabilities} = useSiteCapabilities()
    if (!capabilities[capability]) {
        return null
    }
    return <>{children}</>
}
