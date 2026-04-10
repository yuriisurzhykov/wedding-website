import {getSiteSettings} from '@features/site-settings'
import {AdminSettingsForm} from '@widgets/admin-settings'
import type {Metadata} from 'next'
import {getTranslations} from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('admin.settings')
    return {
        title: t('metaTitle'),
        robots: {index: false, follow: false},
    }
}

export default async function AdminSettingsPage() {
    const settings = await getSiteSettings()

    return <AdminSettingsForm initialSettings={settings}/>
}
