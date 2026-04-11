import {getTranslations} from 'next-intl/server'

type Props = Readonly<{
    titleKey: 'guests' | 'features' | 'schedule' | 'gallery' | 'wishes' | 'email'
}>

export async function AdminStubSection({titleKey}: Props) {
    const t = await getTranslations('admin.stubs')

    return (
        <section className="rounded-lg border border-border bg-bg-card p-6 shadow-card">
            <h1 className="font-display text-h2 text-text-primary">{t(`titles.${titleKey}`)}</h1>
            <p className="mt-2 text-body text-text-secondary">{t('comingSoon')}</p>
        </section>
    )
}
