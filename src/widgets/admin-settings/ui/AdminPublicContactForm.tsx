'use client'

import {useRouter} from '@/i18n/navigation'
import type {EmailSenderRow} from '@entities/email-template'
import type {PublicContact, SiteSettings} from '@entities/site-settings'
import {Button} from '@shared/ui/Button'
import {Input} from '@shared/ui/Input'
import {Select} from '@shared/ui/Select'
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
    const [senderId, setSenderId] = useState<string | null>(
        () => initialSettings.public_contact_sender_id ?? null,
    )
    const [senders, setSenders] = useState<EmailSenderRow[] | null>(null)
    const [saving, setSaving] = useState(false)

    const lastSyncedServerAt = useRef(initialSettings.updated_at)
    useEffect(() => {
        if (initialSettings.updated_at === lastSyncedServerAt.current) {
            return
        }
        lastSyncedServerAt.current = initialSettings.updated_at
        setContact(cloneContact(initialSettings.public_contact))
        setSenderId(initialSettings.public_contact_sender_id ?? null)
    }, [initialSettings])

    useEffect(() => {
        let cancelled = false
        ;(async () => {
            const res = await fetch('/api/admin/email/senders', {credentials: 'include'})
            if (!res.ok || cancelled) {
                return
            }
            const data: unknown = await res.json().catch(() => null)
            if (
                cancelled ||
                typeof data !== 'object' ||
                data === null ||
                !('senders' in data) ||
                !Array.isArray((data as {senders: unknown}).senders)
            ) {
                return
            }
            setSenders((data as {senders: EmailSenderRow[]}).senders)
        })()
        return () => {
            cancelled = true
        }
    }, [])

    function handleSenderSelect(ev: React.ChangeEvent<HTMLSelectElement>) {
        const v = ev.target.value
        if (v === '') {
            setSenderId(null)
            return
        }
        const row = senders?.find((s) => s.id === v)
        if (row) {
            setSenderId(row.id)
            setContact((prev) => ({...prev, email: row.mailbox}))
        }
    }

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
                public_contact_sender_id: senderId,
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
            if (result.public_contact_sender_id !== undefined) {
                setSenderId(result.public_contact_sender_id)
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
                        onChange={(ev) => {
                            setSenderId(null)
                            setContact((prev) => ({...prev, email: ev.target.value}))
                        }}
                        aria-describedby="admin-public-contact-email-hint"
                    />
                    <p id="admin-public-contact-email-hint" className="text-small text-text-muted">
                        {t('emailHint')}
                    </p>
                </div>

                <div className="flex flex-col gap-2">
                    <label
                        className="text-small text-text-secondary"
                        htmlFor="admin-public-contact-sender"
                    >
                        {t('senderLabel')}
                    </label>
                    <Select
                        id="admin-public-contact-sender"
                        name="public_contact_sender_id"
                        value={senderId ?? ''}
                        onChange={handleSenderSelect}
                        disabled={senders === null}
                        aria-describedby="admin-public-contact-sender-hint"
                    >
                        <option value="">{t('senderOptionNone')}</option>
                        {(senders ?? []).map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.label} — {s.mailbox}
                            </option>
                        ))}
                    </Select>
                    <p id="admin-public-contact-sender-hint" className="text-small text-text-muted">
                        {t('senderHint')}
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
