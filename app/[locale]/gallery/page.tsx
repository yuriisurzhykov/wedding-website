import type {Metadata} from 'next'
import {getTranslations} from 'next-intl/server'
import {notFound} from 'next/navigation'

import {getSiteSettingsCached} from '@features/site-settings'
import {SectionFeaturePreview} from '@features/site-settings/client'
import {GallerySection} from '@widgets/gallery-section'

export async function generateMetadata(): Promise<Metadata> {
    const tNav = await getTranslations('nav')
    const tGallery = await getTranslations('gallery')
    return {
        title: tNav('gallery'),
        description: tGallery('subtitle'),
    }
}

export default async function GalleryPage() {
    const siteSettings = await getSiteSettingsCached()
    const state = siteSettings.capabilities.galleryBrowse
    if (state === 'hidden') {
        notFound()
    }
    if (state === 'preview') {
        return (
            <SectionFeaturePreview
                sectionId="gallery"
                theme="alt"
                messageNamespace="gallery"
            />
        )
    }
    return <GallerySection presentation="full"/>
}
