'use client'

import {useRouter} from '@/i18n/navigation'
import type {PublicContact, SiteSettings} from '@entities/site-settings'
import {Button} from '@shared/ui/Button'
import {Input} from '@shared/ui/Input'
import {useTranslations} from 'next-intl'
import {useEffect, useRef, useState} from 'react'
import {toast} from 'sonner'

import {patchAdminSiteSettings} from '../lib/patch-admin-site-settings'

function cloneContact(contact: PublicContact): PublicContact {
    return {phone: contact.phone, email: contact.email}
}

type Props = Readonly<{
    initialSettings: SiteSettings
}>

export function AdminPublicContactForm({initialSettings}: Props) {
    const t = useTranslations('admin.settings.publicContact')
    const tSettings = useTranslations('admin.settings')

    const router = useRouter()

    const [contact, setContact] = useState(() => cloneContact(initialSettings.public_contact))
    const [saving, setSaving] = useState(false)

    const lastSyncedServerAt = useRef(initialSettings.updated_at)
    useEffect(() => {
        if (initialSettings.updated_at === lastSyncedServerAt.current) {
            return
        }
        lastSyncedServerAt.current = initialSettings.updated_at
        setContact(cloneContact(initialSettings.public_contact))
    }, [initialSettings])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (saving) {
            return
        }

        setSaving(true)
        try {
            const result = await patchAdminSiteSettings({
                public_contact: {
                    phone: contact.phone,
                    email: contact.email,
                },
            })

            if (!result.ok && result.status === 401) {
                toast.error(tSettings('errors.notSignedIn'))
                return
            }

            if (!result.ok && result.status === 429) {
                const data = result.data
                const retry =
                    typeof data === 'object' &&
                    data !== null &&
                    'retry_after' in data &&
                    typeof (data as {retry_after: unknown}).retry_after === 'number'
                        ? (data as {retry_after: number}).retry_after
                        : undefined
                toast.error(
                    retry !== undefined
                        ? tSettings('errors.rateLimited', {seconds: retry})
                        : tSettings('errors.rateLimitedGeneric'),
                )
                return
            }

            if (!result.ok) {
                const data = result.data
                const msg =
                    typeof data === 'object' &&
                    data !== null &&
                    'error' in data &&
                    typeof (data as {error: unknown}).error === 'string'
                        ? (data as {error: string}).error
                        : tSettings('errors.saveFailed')
                toast.error(msg)
                return
            }

            if (result.public_contact) {
                setContact(cloneContact(result.public_contact))
            }

            toast.success(t('toast.saved'))
            router.refresh()
        } catch {
            toast.error(tSettings('errors.saveFailed'))
        } finally {
            setSaving(false)
        }
    }

    return (
        <section className="rounded-card border border-border bg-bg-card p-6 shadow-sm">
            <h2 className="font-display text-h3 text-text-primary">{t('title')}</h2>
            <p className="mt-2 text-body text-text-secondary">{t('subtitle')}</p>
            <p className="mt-2 text-small text-text-secondary">{t('hint')}</p>

            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                    <label className="text-small text-text-secondary" htmlFor="admin-public-contact-phone">
                        {t('phoneLabel')}
                    </label>
                    <Input
                        id="admin-public-contact-phone"
                        name="phone"
                        type="text"
                        autoComplete="tel"
                        value={contact.phone}
                        onChange={(ev) => setContact((prev) => ({...prev, phone: ev.target.value}))}
                        aria-describedby="admin-public-contact-phone-hint"
                    />
                    <p id="admin-public-contact-phone-hint" className="text-small text-text-muted">
                        {t('phoneHint')}
                    </p>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-small text-text-secondary" htmlFor="admin-public-contact-email">
                        {t('emailLabel')}
                    </label>
                    <Input
                        id="admin-public-contact-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        value={contact.email}
                        onChange={(ev) => setContact((prev) => ({...prev, email: ev.target.value}))}
                        aria-describedby="admin-public-contact-email-hint"
                    />
                    <p id="admin-public-contact-email-hint" className="text-small text-text-muted">
                        {t('emailHint')}
                    </p>
                </div>

                <div className="flex justify-end pt-2">
                    <Button type="submit" disabled={saving}>
                        {saving ? t('saving') : t('save')}
                    </Button>
                </div>
            </form>
        </section>
    )
}
