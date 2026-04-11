import {AdminGallerySection} from '@widgets/admin-gallery'
import type {Metadata} from 'next'
import {getTranslations} from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('admin.gallery')
    return {
        title: t('metaTitle'),
        robots: {index: false, follow: false},
    }
}

export default function AdminGalleryPage() {
    return <AdminGallerySection />
}
