import {getSiteSettings} from '@features/site-settings'
import {AdminScheduleForm} from '@widgets/admin-settings'
import type {Metadata} from 'next'
import {getTranslations} from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('admin.schedulePage')
    return {
        title: t('metaTitle'),
        robots: {index: false, follow: false},
    }
}

export default async function AdminSchedulePage() {
    const settings = await getSiteSettings()

    return <AdminScheduleForm initialSettings={settings}/>
}
