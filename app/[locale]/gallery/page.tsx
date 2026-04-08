import type {Metadata} from 'next'
import {getTranslations} from 'next-intl/server'

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
    return <GallerySection presentation="full"/>
}
