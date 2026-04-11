import {AdminEmailSection} from '@widgets/admin-email'
import type {Metadata} from 'next'
import {getTranslations} from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('admin.emailPage')
    return {
        title: t('metaTitle'),
        robots: {index: false, follow: false},
    }
}

export default function AdminEmailPage() {
    return <AdminEmailSection />
}
