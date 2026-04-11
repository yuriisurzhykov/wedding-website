import {AdminWishesSection} from '@widgets/admin-wishes'
import type {Metadata} from 'next'
import {getTranslations} from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('admin.wishes')
    return {
        title: t('metaTitle'),
        robots: {index: false, follow: false},
    }
}

export default function AdminWishesPage() {
    return <AdminWishesSection />
}
