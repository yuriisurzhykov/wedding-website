import {AdminLoginForm} from '@widgets/admin-shell'
import type {Metadata} from 'next'
import {getTranslations} from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('admin.login')
    return {
        title: t('metaTitle'),
        robots: {index: false, follow: false},
    }
}

export default function AdminLoginPage() {
    return (
        <div className="bg-bg-base px-4 py-12">
            <AdminLoginForm/>
        </div>
    )
}
