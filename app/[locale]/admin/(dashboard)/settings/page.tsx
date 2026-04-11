import {redirect} from '@/i18n/navigation'
import type {Metadata} from 'next'
import {getTranslations} from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('admin.settings')
    return {
        title: t('metaTitle'),
        robots: {index: false, follow: false},
    }
}

type Props = Readonly<{
    params: Promise<{locale: string}>
}>

/**
 * Legacy URL: site configuration now lives under Features and Schedule.
 */
export default async function AdminSettingsRedirectPage({params}: Props) {
    const {locale} = await params
    redirect({href: '/admin/features', locale})
}
