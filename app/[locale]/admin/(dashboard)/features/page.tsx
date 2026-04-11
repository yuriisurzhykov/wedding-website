import {getSiteSettings} from '@features/site-settings'
import {AdminFeaturesForm} from '@widgets/admin-settings'
import type {Metadata} from 'next'
import {getTranslations} from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('admin.featuresPage')
    return {
        title: t('metaTitle'),
        robots: {index: false, follow: false},
    }
}

export default async function AdminFeaturesPage() {
    const settings = await getSiteSettings()

    return <AdminFeaturesForm initialSettings={settings}/>
}
