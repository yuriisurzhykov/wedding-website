'use client'

import {useRouter} from '@/i18n/navigation'
import {
    FEATURE_STATE_VALUES,
    getCatalogEntryBySegmentId,
    SCHEDULE_I18N_CATALOG,
    SCHEDULE_PROGRAM_ICON_IDS,
    type FeatureState,
    type ScheduleProgramItem,
    SITE_FEATURE_KEYS,
    type SiteCapabilities,
    type SiteSettings,
} from '@entities/site-settings'
import {cn} from '@shared/lib/cn'
import {Button} from '@shared/ui/Button'
import {Input} from '@shared/ui/Input'
import {Select} from '@shared/ui/Select'
import {useSearchParams} from 'next/navigation'
import {useTranslations} from 'next-intl'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {toast} from 'sonner'

const ADMIN_TOKEN_STORAGE_KEY = 'wedding_admin_bearer'

function cloneEditable(settings: SiteSettings): {
    capabilities: SiteCapabilities
    schedule_program: ScheduleProgramItem[]
} {
    return {
        capabilities: {...settings.capabilities},
        schedule_program: settings.schedule_program.map((row) => ({...row})),
    }
}

function segmentIdForRow(row: ScheduleProgramItem): string {
    const match = SCHEDULE_I18N_CATALOG.find(
        (c) => c.titleKey === row.titleKey && c.descKey === row.descKey,
    )
    return match?.segmentId ?? SCHEDULE_I18N_CATALOG[0].segmentId
}

function safeIconIdForSelect(iconId: string): string {
    const ids = SCHEDULE_PROGRAM_ICON_IDS as readonly string[]
    return ids.includes(iconId) ? iconId : SCHEDULE_PROGRAM_ICON_IDS[0]
}

type Props = Readonly<{
    initialSettings: SiteSettings
}>

export function AdminSettingsForm({initialSettings}: Props) {
    const t = useTranslations('admin.settings')
    const router = useRouter()
    const searchParams = useSearchParams()

    const [capabilities, setCapabilities] = useState(() => cloneEditable(initialSettings).capabilities)
    const [scheduleRows, setScheduleRows] = useState(() => cloneEditable(initialSettings).schedule_program)
    const [saving, setSaving] = useState(false)
    const [updatedAt, setUpdatedAt] = useState(initialSettings.updated_at)

    useEffect(() => {
        const fromUrl = searchParams.get('token')?.trim()
        if (fromUrl) {
            try {
                sessionStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, fromUrl)
            } catch {
                /* ignore quota / private mode */
            }
        }
    }, [searchParams])

    const lastSyncedServerAt = useRef(initialSettings.updated_at)
    useEffect(() => {
        if (initialSettings.updated_at === lastSyncedServerAt.current) {
            return
        }
        lastSyncedServerAt.current = initialSettings.updated_at
        setUpdatedAt(initialSettings.updated_at)
        const next = cloneEditable(initialSettings)
        setCapabilities(next.capabilities)
        setScheduleRows(next.schedule_program)
    }, [initialSettings])

    const resolveToken = useCallback((): string | null => {
        const fromUrl = searchParams.get('token')?.trim()
        if (fromUrl) {
            return fromUrl
        }
        try {
            return sessionStorage.getItem(ADMIN_TOKEN_STORAGE_KEY)?.trim() ?? null
        } catch {
            return null
        }
    }, [searchParams])

    function setCapability(key: (typeof SITE_FEATURE_KEYS)[number], value: FeatureState) {
        setCapabilities((prev) => ({...prev, [key]: value}))
    }

    function updateRow(index: number, row: ScheduleProgramItem) {
        setScheduleRows((prev) => {
            const next = [...prev]
            next[index] = row
            return next
        })
    }

    function applyPreset(index: number, segmentId: string) {
        const entry = getCatalogEntryBySegmentId(segmentId)
        if (!entry) {
            return
        }
        const row = scheduleRows[index]
        if (!row) {
            return
        }
        updateRow(index, {
            ...row,
            iconId: entry.iconId,
            titleKey: entry.titleKey,
            descKey: entry.descKey,
        })
    }

    function addRow() {
        const template = SCHEDULE_I18N_CATALOG[0]
        const id = `item-${Date.now()}`
        setScheduleRows((prev) => [
            ...prev,
            {
                id,
                iconId: template.iconId,
                hour: 14,
                minute: 0,
                titleKey: template.titleKey,
                descKey: template.descKey,
                location: '',
                locationUrl: '',
            },
        ])
    }

    function removeRow(index: number) {
        setScheduleRows((prev) => prev.filter((_, i) => i !== index))
    }

    function moveRow(index: number, dir: -1 | 1) {
        const j = index + dir
        if (j < 0 || j >= scheduleRows.length) {
            return
        }
        setScheduleRows((prev) => {
            const next = [...prev]
            ;[next[index], next[j]] = [next[j], next[index]]
            return next
        })
    }

    const duplicateIds = useMemo(() => {
        const counts = new Map<string, number>()
        for (const row of scheduleRows) {
            counts.set(row.id, (counts.get(row.id) ?? 0) + 1)
        }
        const dups = new Set<string>()
        for (const [id, n] of counts) {
            if (n > 1) {
                dups.add(id)
            }
        }
        return dups
    }, [scheduleRows])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (saving) {
            return
        }
        if (duplicateIds.size > 0) {
            toast.error(t('errors.duplicateIds'))
            return
        }
        if (scheduleRows.length === 0) {
            toast.error(t('errors.emptySchedule'))
            return
        }

        const token = resolveToken()
        if (!token) {
            toast.error(t('errors.noToken'))
            return
        }

        setSaving(true)
        try {
            const res = await fetch('/api/admin/site-settings', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    capabilities,
                    schedule_program: scheduleRows,
                }),
            })

            const data: unknown = await res.json().catch(() => null)

            if (!res.ok) {
                const msg =
                    typeof data === 'object' &&
                    data !== null &&
                    'error' in data &&
                    typeof (data as { error: unknown }).error === 'string'
                        ? (data as { error: string }).error
                        : t('errors.saveFailed')
                toast.error(msg)
                return
            }

            if (
                typeof data === 'object' &&
                data !== null &&
                'updated_at' in data &&
                typeof (data as { updated_at: unknown }).updated_at === 'string'
            ) {
                setUpdatedAt((data as { updated_at: string }).updated_at)
            }

            toast.success(t('toast.saved'))
            router.refresh()
        } catch {
            toast.error(t('errors.saveFailed'))
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="mx-auto max-w-3xl px-4 py-10">
            <header className="mb-8">
                <h1 className="font-display text-h2 text-text-primary">{t('title')}</h1>
                <p className="mt-2 text-body text-text-secondary">{t('subtitle')}</p>
                <p className="mt-3 text-small text-text-secondary">{t('accessHint')}</p>
                <p className="mt-1 font-mono text-small text-text-secondary">
                    {t('updatedAtLabel')}: {updatedAt}
                </p>
            </header>

            <form onSubmit={handleSubmit} className="flex flex-col gap-10">
                <section className="rounded-card border border-border bg-bg-card p-6 shadow-sm">
                    <h2 className="font-display text-h3 text-text-primary">{t('capabilities.title')}</h2>
                    <ul className="mt-4 flex flex-col gap-4">
                        {SITE_FEATURE_KEYS.map((key) => (
                            <li
                                key={key}
                                className="flex flex-col gap-2 border-b border-border/60 pb-4 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                            >
                                <span className="text-body text-text-primary">{t(`capabilities.labels.${key}`)}</span>
                                <div className="inline-flex flex-col gap-1 sm:items-end">
                                    <label
                                        className="text-small text-text-secondary"
                                        htmlFor={`admin-feature-state-${key}`}
                                    >
                                        {t('capabilities.state')}
                                    </label>
                                    <Select
                                        id={`admin-feature-state-${key}`}
                                        className="min-w-[12rem] rounded-pill"
                                        value={capabilities[key]}
                                        onChange={(ev) =>
                                            setCapability(key, ev.target.value as FeatureState)
                                        }
                                    >
                                        {FEATURE_STATE_VALUES.map((state) => (
                                            <option key={state} value={state}>
                                                {t(`capabilities.stateLabels.${state}`)}
                                            </option>
                                        ))}
                                    </Select>
                                </div>
                            </li>
                        ))}
                    </ul>
                </section>

                <section className="rounded-card border border-border bg-bg-card p-6 shadow-sm">
                    <div className="flex flex-wrap items-end justify-between gap-4">
                        <h2 className="font-display text-h3 text-text-primary">{t('schedule.title')}</h2>
                        <Button type="button" variant="secondary" size="sm" onClick={addRow}>
                            {t('schedule.addRow')}
                        </Button>
                    </div>

                    <div className="mt-6 flex flex-col gap-8">
                        {scheduleRows.map((row, index) => (
                            <div
                                key={`${row.id}-${index}`}
                                className={cn(
                                    'rounded-pill border border-border bg-bg-section p-4',
                                    duplicateIds.has(row.id) && 'border-primary-dark ring-2 ring-primary/30',
                                )}
                            >
                                <div className="flex flex-wrap items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        disabled={index === 0}
                                        onClick={() => moveRow(index, -1)}
                                    >
                                        {t('schedule.moveUp')}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        disabled={index === scheduleRows.length - 1}
                                        onClick={() => moveRow(index, 1)}
                                    >
                                        {t('schedule.moveDown')}
                                    </Button>
                                    <Button type="button" variant="outline" size="sm" onClick={() => removeRow(index)}>
                                        {t('schedule.removeRow')}
                                    </Button>
                                </div>

                                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                    <label className="flex flex-col gap-1">
                                        <span
                                            className="text-small font-medium text-text-primary">{t('schedule.rowId')}</span>
                                        <Input
                                            value={row.id}
                                            onChange={(ev) =>
                                                updateRow(index, {...row, id: ev.target.value})
                                            }
                                            autoComplete="off"
                                        />
                                    </label>
                                    <label className="flex flex-col gap-1">
                                        <span className="text-small font-medium text-text-primary">
                                            {t('schedule.messagePreset')}
                                        </span>
                                        <select
                                            className="rounded-pill border border-border bg-bg-card px-4 py-3 text-body text-text-primary"
                                            value={segmentIdForRow(row)}
                                            onChange={(ev) => applyPreset(index, ev.target.value)}
                                        >
                                            {SCHEDULE_I18N_CATALOG.map((c) => (
                                                <option key={c.segmentId} value={c.segmentId}>
                                                    {t(`segments.${c.segmentId}`)}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                    <label className="flex flex-col gap-1">
                                        <span
                                            className="text-small font-medium text-text-primary">{t('schedule.icon')}</span>
                                        <select
                                            className="rounded-pill border border-border bg-bg-card px-4 py-3 text-body text-text-primary"
                                            value={safeIconIdForSelect(row.iconId)}
                                            onChange={(ev) =>
                                                updateRow(index, {...row, iconId: ev.target.value})
                                            }
                                        >
                                            {SCHEDULE_PROGRAM_ICON_IDS.map((id) => (
                                                <option key={id} value={id}>
                                                    {t(`schedule.icons.${id}`)}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                    <div className="flex gap-2 sm:col-span-2">
                                        <label className="flex flex-1 flex-col gap-1">
                                            <span className="text-small font-medium text-text-primary">
                                                {t('schedule.hour')}
                                            </span>
                                            <Input
                                                inputMode="numeric"
                                                min={0}
                                                max={23}
                                                value={row.hour}
                                                onChange={(ev) => {
                                                    const v = Number(ev.target.value)
                                                    updateRow(index, {
                                                        ...row,
                                                        hour: Number.isFinite(v)
                                                            ? Math.min(23, Math.max(0, Math.floor(v)))
                                                            : row.hour,
                                                    })
                                                }}
                                            />
                                        </label>
                                        <label className="flex flex-1 flex-col gap-1">
                                            <span className="text-small font-medium text-text-primary">
                                                {t('schedule.minute')}
                                            </span>
                                            <Input
                                                inputMode="numeric"
                                                min={0}
                                                max={59}
                                                value={row.minute}
                                                onChange={(ev) => {
                                                    const v = Number(ev.target.value)
                                                    updateRow(index, {
                                                        ...row,
                                                        minute: Number.isFinite(v)
                                                            ? Math.min(59, Math.max(0, Math.floor(v)))
                                                            : row.minute,
                                                    })
                                                }}
                                            />
                                        </label>
                                    </div>
                                    <label className="flex flex-col gap-1 sm:col-span-2">
                                        <span className="text-small font-medium text-text-primary">
                                            {t('schedule.titleKey')}
                                        </span>
                                        <Input value={row.titleKey} readOnly className="opacity-80"/>
                                    </label>
                                    <label className="flex flex-col gap-1 sm:col-span-2">
                                        <span className="text-small font-medium text-text-primary">
                                            {t('schedule.descKey')}
                                        </span>
                                        <Input value={row.descKey} readOnly className="opacity-80"/>
                                    </label>
                                    <label className="flex flex-col gap-1 sm:col-span-2">
                                        <span className="text-small font-medium text-text-primary">
                                            {t('schedule.location')}
                                        </span>
                                        <Input
                                            value={row.location}
                                            onChange={(ev) =>
                                                updateRow(index, {...row, location: ev.target.value})
                                            }
                                        />
                                    </label>
                                    <label className="flex flex-col gap-1 sm:col-span-2">
                                        <span className="text-small font-medium text-text-primary">
                                            {t('schedule.locationUrl')}
                                        </span>
                                        <Input
                                            value={row.locationUrl}
                                            onChange={(ev) =>
                                                updateRow(index, {...row, locationUrl: ev.target.value})
                                            }
                                        />
                                    </label>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <div className="flex justify-end">
                    <Button type="submit" disabled={saving}>
                        {saving ? t('saving') : t('save')}
                    </Button>
                </div>
            </form>
        </div>
    )
}
