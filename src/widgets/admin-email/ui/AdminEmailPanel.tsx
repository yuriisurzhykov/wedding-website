'use client'

import {useRouter} from '@/i18n/navigation'
import {
    EMAIL_TEMPLATE_PLACEHOLDER_KEYS,
    type EmailSendLogRow,
    type EmailSenderRow,
    type EmailTemplateRow,
} from '@entities/email-template'
import {cn} from '@shared/lib/cn'
import {Button} from '@shared/ui/Button'
import {Input} from '@shared/ui/Input'
import {Select} from '@shared/ui/Select'
import {useTranslations} from 'next-intl'
import {useCallback, useEffect, useMemo, useState} from 'react'
import {toast} from 'sonner'

import {
    deleteAdminEmailSender,
    deleteAdminEmailTemplate,
    fetchAdminEmailLog,
    patchAdminEmailSender,
    patchAdminEmailTemplate,
    postAdminEmailSend,
    postAdminEmailSender,
    postAdminEmailTemplate,
} from '../lib/call-admin-email-api'

type Props = Readonly<{
    initialSenders: EmailSenderRow[]
    initialTemplates: EmailTemplateRow[]
    initialLog: EmailSendLogRow[]
}>

function readErrorMessage(data: unknown, fallback: string): string {
    if (
        typeof data === 'object' &&
        data !== null &&
        'error' in data &&
        typeof (data as {error: unknown}).error === 'string'
    ) {
        return (data as {error: string}).error
    }
    return fallback
}

function formatSenderLine(row: EmailSenderRow): string {
    return row.display_name?.trim()
        ? `${row.display_name.trim()} <${row.mailbox}>`
        : row.mailbox
}

type EmailTab = 'senders' | 'templates' | 'broadcast' | 'log'

export function AdminEmailPanel({
    initialSenders,
    initialTemplates,
    initialLog,
}: Props) {
    const t = useTranslations('admin.emailPage')
    const tSettings = useTranslations('admin.settings')
    const router = useRouter()

    const [senders, setSenders] = useState(initialSenders)
    const [templates, setTemplates] = useState(initialTemplates)
    const [log, setLog] = useState(initialLog)

    const [templateSenderId, setTemplateSenderId] = useState('')
    const [sendOverrideSenderId, setSendOverrideSenderId] = useState('')

    const [senderEditId, setSenderEditId] = useState<string | null>(null)
    const [sLabel, setSLabel] = useState('')
    const [sMailbox, setSMailbox] = useState('')
    const [sDisplayName, setSDisplayName] = useState('')
    const [savingSender, setSavingSender] = useState(false)

    const [slug, setSlug] = useState('')
    const [name, setName] = useState('')
    const [subjectTemplate, setSubjectTemplate] = useState('')
    const [bodyHtml, setBodyHtml] = useState('')
    const [bodyText, setBodyText] = useState('')
    const [editingId, setEditingId] = useState<string | null>(null)

    const [sendTemplateId, setSendTemplateId] = useState(
        () => initialTemplates[0]?.id ?? '',
    )
    const [sendMode, setSendMode] = useState<'test' | 'broadcast'>('test')
    const [testEmail, setTestEmail] = useState('')
    const [segment, setSegment] = useState<'all' | 'attending' | 'not_attending'>(
        'all',
    )

    const [saving, setSaving] = useState(false)
    const [sending, setSending] = useState(false)
    const [loadingLog, setLoadingLog] = useState(false)

    const [tab, setTab] = useState<EmailTab>('senders')

    const tabDefs = useMemo(
        () =>
            [
                {id: 'senders' as const, label: t('tabs.senders')},
                {id: 'templates' as const, label: t('tabs.templates')},
                {id: 'broadcast' as const, label: t('tabs.broadcast')},
                {id: 'log' as const, label: t('tabs.recentSends')},
            ] as const,
        [t],
    )

    useEffect(() => {
        setSenders(initialSenders)
    }, [initialSenders])

    useEffect(() => {
        setTemplates(initialTemplates)
    }, [initialTemplates])

    useEffect(() => {
        setLog(initialLog)
    }, [initialLog])

    useEffect(() => {
        if (sendTemplateId && !templates.some((r) => r.id === sendTemplateId)) {
            setSendTemplateId(templates[0]?.id ?? '')
        }
    }, [templates, sendTemplateId])

    const placeholderHint = useMemo(
        () =>
            EMAIL_TEMPLATE_PLACEHOLDER_KEYS.map((k) => `{{${k}}}`).join(
                ' ',
            ),
        [],
    )

    const refreshServer = useCallback(() => {
        router.refresh()
    }, [router])

    const reloadLog = useCallback(async () => {
        setLoadingLog(true)
        try {
            const result = await fetchAdminEmailLog()
            if (!result.ok) {
                if (result.status === 401) {
                    toast.error(tSettings('errors.notSignedIn'))
                    return
                }
                toast.error(
                    readErrorMessage(result.data, t('toast.logLoadFailed')),
                )
                return
            }
            const rows = result.data.log
            if (Array.isArray(rows)) {
                setLog(rows as EmailSendLogRow[])
            }
        } finally {
            setLoadingLog(false)
        }
    }, [t, tSettings])

    function resetForm() {
        setEditingId(null)
        setSlug('')
        setName('')
        setSubjectTemplate('')
        setBodyHtml('')
        setBodyText('')
        setTemplateSenderId('')
    }

    function startEdit(row: EmailTemplateRow) {
        setEditingId(row.id)
        setSlug(row.slug)
        setName(row.name)
        setSubjectTemplate(row.subject_template)
        setBodyHtml(row.body_html)
        setBodyText(row.body_text ?? '')
        setTemplateSenderId(row.sender_id ?? '')
    }

    function resetSenderForm() {
        setSenderEditId(null)
        setSLabel('')
        setSMailbox('')
        setSDisplayName('')
    }

    function startSenderEdit(row: EmailSenderRow) {
        setSenderEditId(row.id)
        setSLabel(row.label)
        setSMailbox(row.mailbox)
        setSDisplayName(row.display_name ?? '')
    }

    async function handleSaveSender(e: React.FormEvent) {
        e.preventDefault()
        if (savingSender) {
            return
        }
        setSavingSender(true)
        try {
            if (senderEditId) {
                const result = await patchAdminEmailSender(senderEditId, {
                    label: sLabel,
                    mailbox: sMailbox,
                    display_name: sDisplayName || null,
                })
                if (!result.ok && result.status === 401) {
                    toast.error(tSettings('errors.notSignedIn'))
                    return
                }
                if (!result.ok && result.status === 429) {
                    toast.error(tSettings('errors.rateLimitedGeneric'))
                    return
                }
                if (!result.ok) {
                    toast.error(
                        readErrorMessage(result.data, t('toast.senderSaveFailed')),
                    )
                    return
                }
                toast.success(t('toast.senderSaved'))
            } else {
                const result = await postAdminEmailSender({
                    label: sLabel,
                    mailbox: sMailbox,
                    display_name: sDisplayName || null,
                })
                if (!result.ok && result.status === 401) {
                    toast.error(tSettings('errors.notSignedIn'))
                    return
                }
                if (!result.ok && result.status === 429) {
                    toast.error(tSettings('errors.rateLimitedGeneric'))
                    return
                }
                if (!result.ok) {
                    toast.error(
                        readErrorMessage(result.data, t('toast.senderSaveFailed')),
                    )
                    return
                }
                toast.success(t('toast.senderCreated'))
            }
            resetSenderForm()
            refreshServer()
        } finally {
            setSavingSender(false)
        }
    }

    async function handleDeleteSender(id: string) {
        if (!window.confirm(t('confirmDeleteSender'))) {
            return
        }
        const result = await deleteAdminEmailSender(id)
        if (!result.ok && result.status === 401) {
            toast.error(tSettings('errors.notSignedIn'))
            return
        }
        if (!result.ok) {
            toast.error(readErrorMessage(result.data, t('toast.senderDeleteFailed')))
            return
        }
        if (templateSenderId === id) {
            setTemplateSenderId('')
        }
        if (sendOverrideSenderId === id) {
            setSendOverrideSenderId('')
        }
        toast.success(t('toast.senderDeleted'))
        resetSenderForm()
        refreshServer()
    }

    async function handleSaveTemplate(e: React.FormEvent) {
        e.preventDefault()
        if (saving) {
            return
        }
        setSaving(true)
        try {
            if (editingId) {
                const result = await patchAdminEmailTemplate(editingId, {
                    slug: slug || undefined,
                    name: name || undefined,
                    subject_template: subjectTemplate || undefined,
                    body_html: bodyHtml || undefined,
                    body_text: bodyText || null,
                    sender_id: templateSenderId ? templateSenderId : null,
                })
                if (!result.ok && result.status === 401) {
                    toast.error(tSettings('errors.notSignedIn'))
                    return
                }
                if (!result.ok && result.status === 429) {
                    toast.error(tSettings('errors.rateLimitedGeneric'))
                    return
                }
                if (!result.ok) {
                    toast.error(
                        readErrorMessage(result.data, t('toast.templateSaveFailed')),
                    )
                    return
                }
                toast.success(t('toast.templateSaved'))
            } else {
                const result = await postAdminEmailTemplate({
                    slug,
                    name,
                    subject_template: subjectTemplate,
                    body_html: bodyHtml,
                    body_text: bodyText || null,
                    sender_id: templateSenderId ? templateSenderId : null,
                })
                if (!result.ok && result.status === 401) {
                    toast.error(tSettings('errors.notSignedIn'))
                    return
                }
                if (!result.ok && result.status === 429) {
                    toast.error(tSettings('errors.rateLimitedGeneric'))
                    return
                }
                if (!result.ok) {
                    toast.error(
                        readErrorMessage(result.data, t('toast.templateSaveFailed')),
                    )
                    return
                }
                toast.success(t('toast.templateCreated'))
            }
            resetForm()
            refreshServer()
        } finally {
            setSaving(false)
        }
    }

    async function handleDelete(id: string) {
        if (!window.confirm(t('confirmDeleteTemplate'))) {
            return
        }
        const result = await deleteAdminEmailTemplate(id)
        if (!result.ok && result.status === 401) {
            toast.error(tSettings('errors.notSignedIn'))
            return
        }
        if (!result.ok) {
            toast.error(readErrorMessage(result.data, t('toast.templateDeleteFailed')))
            return
        }
        setTemplates((prev) => prev.filter((r) => r.id !== id))
        if (editingId === id) {
            resetForm()
        }
        if (sendTemplateId === id) {
            setSendTemplateId('')
        }
        toast.success(t('toast.templateDeleted'))
        refreshServer()
    }

    async function handleSend(e: React.FormEvent) {
        e.preventDefault()
        if (sending || !sendTemplateId) {
            return
        }
        setSending(true)
        try {
            const base = {
                template_id: sendTemplateId,
                ...(sendOverrideSenderId
                    ? {sender_id: sendOverrideSenderId}
                    : {}),
            }
            const payload =
                sendMode === 'test'
                    ? {
                          mode: 'test' as const,
                          ...base,
                          test_email: testEmail.trim(),
                      }
                    : {
                          mode: 'broadcast' as const,
                          ...base,
                          segment,
                      }

            const result = await postAdminEmailSend(payload)
            if (!result.ok && result.status === 401) {
                toast.error(tSettings('errors.notSignedIn'))
                return
            }
            if (!result.ok && result.status === 429) {
                toast.error(tSettings('errors.rateLimitedGeneric'))
                return
            }
            if (!result.ok) {
                toast.error(readErrorMessage(result.data, t('toast.sendFailed')))
                return
            }
            const d = result.data
            toast.success(
                t('toast.sendDone', {
                    sent: d.sent,
                    failed: d.failed,
                }),
            )
            if (d.capped_total !== undefined) {
                toast(t('toast.sendCapped', {total: d.capped_total}))
            }
            setTab('log')
            await reloadLog()
            refreshServer()
        } finally {
            setSending(false)
        }
    }

    return (
        <div>
            <nav
                className="flex flex-wrap gap-1 border-b border-border"
                aria-label={t('tabsAria')}
                role="tablist"
            >
                {tabDefs.map(({id, label}) => (
                    <button
                        key={id}
                        type="button"
                        role="tab"
                        aria-selected={tab === id}
                        className={cn(
                            '-mb-px border-b-2 px-3 py-2.5 text-small font-medium transition-colors',
                            tab === id
                                ? 'border-primary text-text-primary'
                                : 'border-transparent text-text-secondary hover:text-text-primary',
                        )}
                        onClick={() => setTab(id)}
                    >
                        {label}
                    </button>
                ))}
            </nav>

            <div className="mt-6 min-h-[280px]">
                {tab === 'senders' ? (
                    <section className="space-y-4">
                        <p className="text-body text-text-secondary">
                            {t('sendersIntro')}
                        </p>

                {senders.length > 0 && (
                    <ul className="mt-4 space-y-2">
                        {senders.map((row) => (
                            <li
                                key={row.id}
                                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-bg-base px-3 py-2"
                            >
                                <span className="text-body text-text-primary">
                                    <span className="font-medium">{row.label}</span>
                                    <span className="text-text-secondary">
                                        {' '}
                                        — {formatSenderLine(row)}
                                    </span>
                                </span>
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => startSenderEdit(row)}
                                    >
                                        {t('edit')}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => handleDeleteSender(row.id)}
                                    >
                                        {t('delete')}
                                    </Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}

                <form className="mt-6 space-y-4" onSubmit={handleSaveSender}>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label
                                className="text-small text-text-secondary"
                                htmlFor="sender-label"
                            >
                                {t('senderFields.label')}
                            </label>
                            <Input
                                id="sender-label"
                                value={sLabel}
                                onChange={(e) => setSLabel(e.target.value)}
                                required
                                autoComplete="off"
                            />
                        </div>
                        <div>
                            <label
                                className="text-small text-text-secondary"
                                htmlFor="sender-mailbox"
                            >
                                {t('senderFields.mailbox')}
                            </label>
                            <Input
                                id="sender-mailbox"
                                type="email"
                                value={sMailbox}
                                onChange={(e) => setSMailbox(e.target.value)}
                                required
                                autoComplete="off"
                            />
                        </div>
                    </div>
                    <div>
                        <label
                            className="text-small text-text-secondary"
                            htmlFor="sender-display"
                        >
                            {t('senderFields.displayName')}
                        </label>
                        <Input
                            id="sender-display"
                            value={sDisplayName}
                            onChange={(e) => setSDisplayName(e.target.value)}
                            placeholder={t('senderFields.displayNamePlaceholder')}
                            autoComplete="off"
                        />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button type="submit" disabled={savingSender}>
                            {senderEditId ? t('saveSender') : t('createSender')}
                        </Button>
                        {senderEditId ? (
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={resetSenderForm}
                            >
                                {t('cancelSenderEdit')}
                            </Button>
                        ) : null}
                    </div>
                </form>
                    </section>
                ) : tab === 'templates' ? (
                    <section className="space-y-4">
                        <p className="text-small text-text-secondary">
                            {t('placeholdersHint', {keys: placeholderHint})}
                        </p>

                {templates.length > 0 && (
                    <ul className="mt-4 space-y-2">
                        {templates.map((row) => (
                            <li
                                key={row.id}
                                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-bg-base px-3 py-2"
                            >
                                <span className="text-body text-text-primary">
                                    <span className="font-medium">{row.name}</span>{' '}
                                    <span className="text-text-secondary">
                                        ({row.slug})
                                    </span>
                                    {row.sender_id ? (
                                        <span className="text-text-muted">
                                            {' '}
                                            · {t('templateFromBadge')}{' '}
                                            {senders.find((s) => s.id === row.sender_id)
                                                ?.label ?? row.sender_id}
                                        </span>
                                    ) : null}
                                </span>
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => startEdit(row)}
                                    >
                                        {t('edit')}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => handleDelete(row.id)}
                                    >
                                        {t('delete')}
                                    </Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}

                <form className="mt-6 space-y-4" onSubmit={handleSaveTemplate}>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="text-small text-text-secondary" htmlFor="tmpl-slug">
                                {t('fields.slug')}
                            </label>
                            <Input
                                id="tmpl-slug"
                                value={slug}
                                onChange={(e) => setSlug(e.target.value)}
                                required={!editingId}
                                disabled={!!editingId}
                                autoComplete="off"
                            />
                        </div>
                        <div>
                            <label className="text-small text-text-secondary" htmlFor="tmpl-name">
                                {t('fields.name')}
                            </label>
                            <Input
                                id="tmpl-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label
                            className="text-small text-text-secondary"
                            htmlFor="tmpl-subject"
                        >
                            {t('fields.subject')}
                        </label>
                        <Input
                            id="tmpl-subject"
                            value={subjectTemplate}
                            onChange={(e) => setSubjectTemplate(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label
                            className="text-small text-text-secondary"
                            htmlFor="tmpl-html"
                        >
                            {t('fields.bodyHtml')}
                        </label>
                        <textarea
                            id="tmpl-html"
                            className="border-border bg-bg-base text-text-primary focus:border-primary min-h-[140px] w-full rounded-md border px-3 py-2 text-body outline-none"
                            value={bodyHtml}
                            onChange={(e) => setBodyHtml(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label
                            className="text-small text-text-secondary"
                            htmlFor="tmpl-text"
                        >
                            {t('fields.bodyText')}
                        </label>
                        <textarea
                            id="tmpl-text"
                            className="border-border bg-bg-base text-text-primary focus:border-primary min-h-[80px] w-full rounded-md border px-3 py-2 text-body outline-none"
                            value={bodyText}
                            onChange={(e) => setBodyText(e.target.value)}
                        />
                    </div>
                    <div>
                        <label
                            className="text-small text-text-secondary"
                            htmlFor="tmpl-sender"
                        >
                            {t('fields.templateSender')}
                        </label>
                        <Select
                            id="tmpl-sender"
                            value={templateSenderId}
                            onChange={(e) => setTemplateSenderId(e.target.value)}
                        >
                            <option value="">{t('fields.templateSenderDefault')}</option>
                            {senders.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.label} ({formatSenderLine(s)})
                                </option>
                            ))}
                        </Select>
                        <p className="mt-1 text-small text-text-muted">
                            {t('fields.templateSenderHint')}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button type="submit" disabled={saving}>
                            {editingId ? t('saveTemplate') : t('createTemplate')}
                        </Button>
                        {editingId ? (
                            <Button type="button" variant="secondary" onClick={resetForm}>
                                {t('cancelEdit')}
                            </Button>
                        ) : null}
                    </div>
                </form>
                    </section>
                ) : tab === 'broadcast' ? (
                    <section className="space-y-4">
                        <p className="text-body text-text-secondary">{t('sendIntro')}</p>

                <form className="mt-6 space-y-4" onSubmit={handleSend}>
                    <div>
                        <label className="text-small text-text-secondary" htmlFor="send-tpl">
                            {t('fields.pickTemplate')}
                        </label>
                        <Select
                            id="send-tpl"
                            value={sendTemplateId}
                            onChange={(e) => setSendTemplateId(e.target.value)}
                            required
                        >
                            <option value="">{t('fields.pickTemplatePlaceholder')}</option>
                            {templates.map((row) => (
                                <option key={row.id} value={row.id}>
                                    {row.name}
                                </option>
                            ))}
                        </Select>
                    </div>

                    <div>
                        <label
                            className="text-small text-text-secondary"
                            htmlFor="send-from"
                        >
                            {t('fields.sendFrom')}
                        </label>
                        <Select
                            id="send-from"
                            value={sendOverrideSenderId}
                            onChange={(e) => setSendOverrideSenderId(e.target.value)}
                        >
                            <option value="">{t('fields.sendFromDefault')}</option>
                            {senders.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.label} ({formatSenderLine(s)})
                                </option>
                            ))}
                        </Select>
                        <p className="mt-1 text-small text-text-muted">
                            {t('fields.sendFromHint')}
                        </p>
                    </div>

                    <div>
                        <span className="text-small text-text-secondary">{t('fields.mode')}</span>
                        <div className="mt-2 flex flex-wrap gap-3">
                            <label className="flex items-center gap-2 text-body text-text-primary">
                                <input
                                    type="radio"
                                    name="sendMode"
                                    checked={sendMode === 'test'}
                                    onChange={() => setSendMode('test')}
                                />
                                {t('modeTest')}
                            </label>
                            <label className="flex items-center gap-2 text-body text-text-primary">
                                <input
                                    type="radio"
                                    name="sendMode"
                                    checked={sendMode === 'broadcast'}
                                    onChange={() => setSendMode('broadcast')}
                                />
                                {t('modeBroadcast')}
                            </label>
                        </div>
                    </div>

                    {sendMode === 'test' ? (
                        <div>
                            <label
                                className="text-small text-text-secondary"
                                htmlFor="test-email"
                            >
                                {t('fields.testEmail')}
                            </label>
                            <Input
                                id="test-email"
                                type="email"
                                value={testEmail}
                                onChange={(e) => setTestEmail(e.target.value)}
                                required
                            />
                        </div>
                    ) : (
                        <div>
                            <label className="text-small text-text-secondary" htmlFor="segment">
                                {t('fields.segment')}
                            </label>
                            <Select
                                id="segment"
                                value={segment}
                                onChange={(e) =>
                                    setSegment(
                                        e.target.value as 'all' | 'attending' | 'not_attending',
                                    )
                                }
                            >
                                <option value="all">{t('segmentAll')}</option>
                                <option value="attending">{t('segmentAttending')}</option>
                                <option value="not_attending">
                                    {t('segmentNotAttending')}
                                </option>
                            </Select>
                        </div>
                    )}

                    <Button type="submit" disabled={sending || !sendTemplateId}>
                        {sending ? t('sending') : t('send')}
                    </Button>
                </form>
                    </section>
                ) : tab === 'log' ? (
                    <section>
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="font-display text-h3 text-text-primary">
                        {t('logHeading')}
                    </h2>
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={reloadLog}
                        disabled={loadingLog}
                    >
                        {loadingLog ? t('logRefreshing') : t('logRefresh')}
                    </Button>
                </div>

                {log.length === 0 ? (
                    <p className="mt-4 text-body text-text-secondary">{t('logEmpty')}</p>
                ) : (
                    <div className="mt-4 overflow-x-auto">
                        <table className="w-full min-w-[880px] border-collapse text-left text-small">
                            <thead>
                                <tr className="border-b border-border text-text-secondary">
                                    <th className="py-2 pr-2">{t('logColumns.time')}</th>
                                    <th className="py-2 pr-2">{t('logColumns.from')}</th>
                                    <th className="py-2 pr-2">{t('logColumns.to')}</th>
                                    <th className="py-2 pr-2">{t('logColumns.status')}</th>
                                    <th className="py-2 pr-2">{t('logColumns.segment')}</th>
                                    <th className="py-2">{t('logColumns.subject')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {log.map((row) => (
                                    <tr key={row.id} className="border-b border-border/60">
                                        <td className="py-2 pr-2 text-text-primary">
                                            {new Date(row.created_at).toLocaleString()}
                                        </td>
                                        <td className="max-w-[200px] truncate py-2 pr-2 text-text-secondary">
                                            {row.from_address ?? '—'}
                                        </td>
                                        <td className="py-2 pr-2 text-text-primary">
                                            {row.recipient_email}
                                        </td>
                                        <td className="py-2 pr-2 text-text-primary">
                                            {row.status === 'sent'
                                                ? t('statusSent')
                                                : t('statusFailed')}
                                        </td>
                                        <td className="py-2 pr-2 text-text-secondary">
                                            {row.segment ?? '—'}
                                        </td>
                                        <td className="py-2 text-text-secondary">{row.subject}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                    </section>
                ) : null}
            </div>
        </div>
    )
}
