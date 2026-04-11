'use client'

import {isFeatureEnabled, isFeatureHidden,} from '@entities/site-settings'
import type {ReactNode} from 'react'

import {SectionFeaturePreview} from './SectionFeaturePreview'
import {useSiteCapabilities} from './SiteCapabilitiesProvider'

import type {SectionTheme} from '@shared/ui'

type Props = Readonly<{
    theme: SectionTheme
    children: ReactNode
}>

/** Home-only: visibility follows {@link capabilities.galleryBrowse} (album); upload/delete are handled inside the gallery island. */
export function GalleryHomeGate({theme, children}: Props) {
    const {capabilities} = useSiteCapabilities()
    const state = capabilities.galleryBrowse
    if (isFeatureHidden(state)) {
        return null
    }
    if (!isFeatureEnabled(state)) {
        return (
            <SectionFeaturePreview
                sectionId="gallery"
                theme={theme}
                messageNamespace="gallery"
            />
        )
    }
    return <>{children}</>
}
