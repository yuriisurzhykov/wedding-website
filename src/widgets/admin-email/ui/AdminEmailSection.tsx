import {listEmailSendLogForAdmin} from '@features/admin-email-dispatch'
import {listEmailSendersForAdmin} from '@features/admin-email-senders'
import {listEmailTemplatesForAdmin} from '@features/admin-email-templates'
import {getTranslations} from 'next-intl/server'

import {AdminEmailPanel} from './AdminEmailPanel'

export async function AdminEmailSection() {
    const t = await getTranslations('admin.emailPage')

    const [tpl, logResult, sendersResult] = await Promise.all([
        listEmailTemplatesForAdmin(),
        listEmailSendLogForAdmin({limit: 80}),
        listEmailSendersForAdmin(),
    ])

    if (!tpl.ok) {
        return (
            <section className="rounded-lg border border-border bg-bg-card p-6 shadow-card">
                <h1 className="font-display text-h2 text-text-primary">{t('title')}</h1>
                <p className="mt-4 text-body text-red-500" role="alert">
                    {t('loadError')}
                </p>
            </section>
        )
    }

    if (!logResult.ok) {
        return (
            <section className="rounded-lg border border-border bg-bg-card p-6 shadow-card">
                <h1 className="font-display text-h2 text-text-primary">{t('title')}</h1>
                <p className="mt-4 text-body text-red-500" role="alert">
                    {t('loadError')}
                </p>
            </section>
        )
    }

    if (!sendersResult.ok) {
        return (
            <section className="rounded-lg border border-border bg-bg-card p-6 shadow-card">
                <h1 className="font-display text-h2 text-text-primary">{t('title')}</h1>
                <p className="mt-4 text-body text-red-500" role="alert">
                    {t('loadError')}
                </p>
            </section>
        )
    }

    return (
        <section className="rounded-lg border border-border bg-bg-card p-6 shadow-card">
            <h1 className="font-display text-h2 text-text-primary">{t('title')}</h1>
            <p className="mt-2 text-body text-text-secondary">{t('subtitle')}</p>
            <div className="mt-8">
                <AdminEmailPanel
                    initialSenders={sendersResult.rows}
                    initialTemplates={tpl.rows}
                    initialLog={logResult.rows}
                />
            </div>
        </section>
    )
}
