import type {Metadata} from 'next'
import {getTranslations} from 'next-intl/server'

import {AdminDashboardSection} from '@widgets/admin-dashboard'

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('admin.dashboard')
    return {
        title: t('metaTitle'),
        robots: {index: false, follow: false},
    }
}

export default async function AdminDashboardPage() {
    return <AdminDashboardSection />
}
