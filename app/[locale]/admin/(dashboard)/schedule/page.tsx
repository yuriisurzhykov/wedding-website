import {getWeddingSchedule} from '@features/wedding-schedule'
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
    const schedule = await getWeddingSchedule()

    return (
        <AdminScheduleForm
            initialItems={schedule.items}
            sectionUpdatedAt={schedule.section?.updated_at ?? ''}
        />
    )
}
