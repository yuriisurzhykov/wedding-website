'use client'

import {useRouter} from '@/i18n/navigation'
import {
    getCatalogEntryBySegmentId,
    SCHEDULE_I18N_CATALOG,
    SCHEDULE_PROGRAM_ICON_IDS,
    type ScheduleProgramItem,
    type SiteSettings,
} from '@entities/site-settings'
import {cn} from '@shared/lib/cn'
import {Button} from '@shared/ui/Button'
import {Input} from '@shared/ui/Input'
import {useTranslations} from 'next-intl'
import {useEffect, useMemo, useRef, useState} from 'react'
import {toast} from 'sonner'

import {patchAdminSiteSettings} from '../lib/patch-admin-site-settings'

function cloneSchedule(settings: SiteSettings): ScheduleProgramItem[] {
    return settings.schedule_program.map((row) => ({...row}))
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

function clearAllEmphasis(rows: ScheduleProgramItem[]): ScheduleProgramItem[] {
    return rows.map((r) => ({...r, emphasis: false}))
}

function setEmphasisOnlyAt(rows: ScheduleProgramItem[], index: number): ScheduleProgramItem[] {
    return rows.map((r, i) => ({...r, emphasis: i === index}))
}

function formatRowTimeLabel(row: ScheduleProgramItem): string {
    const h = String(row.hour).padStart(2, '0')
    const m = String(row.minute).padStart(2, '0')
    return `${h}:${m}`
}

type Props = Readonly<{
    initialSettings: SiteSettings
}>

export function AdminScheduleForm({initialSettings}: Props) {
    const tPage = useTranslations('admin.schedulePage')
    const tSettings = useTranslations('admin.settings')

    const router = useRouter()

    const [scheduleRows, setScheduleRows] = useState(() => cloneSchedule(initialSettings))
    const [saving, setSaving] = useState(false)
    const [updatedAt, setUpdatedAt] = useState(initialSettings.updated_at)

    const lastSyncedServerAt = useRef(initialSettings.updated_at)
    useEffect(() => {
        if (initialSettings.updated_at === lastSyncedServerAt.current) {
            return
        }
        lastSyncedServerAt.current = initialSettings.updated_at
        setUpdatedAt(initialSettings.updated_at)
        setScheduleRows(cloneSchedule(initialSettings))
    }, [initialSettings])

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
                emphasis: false,
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
            toast.error(tSettings('errors.duplicateIds'))
            return
        }
        if (scheduleRows.length === 0) {
            toast.error(tSettings('errors.emptySchedule'))
            return
        }

        const emphasisCount = scheduleRows.filter((r) => r.emphasis).length
        if (emphasisCount > 1) {
            toast.error(tSettings('errors.multipleEmphasis'))
            return
        }

        setSaving(true)
        try {
            const result = await patchAdminSiteSettings({schedule_program: scheduleRows})

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

            if (result.updated_at) {
                setUpdatedAt(result.updated_at)
            }

            toast.success(tPage('toast.saved'))
            router.refresh()
        } catch {
            toast.error(tSettings('errors.saveFailed'))
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="mx-auto max-w-3xl px-4 py-10">
            <header className="mb-8">
                <h1 className="font-display text-h2 text-text-primary">{tPage('title')}</h1>
                <p className="mt-2 text-body text-text-secondary">{tPage('subtitle')}</p>
                <p className="mt-3 text-small text-text-secondary">{tPage('accessHint')}</p>
                <p className="mt-1 font-mono text-small text-text-secondary">
                    {tSettings('updatedAtLabel')}: {updatedAt}
                </p>
            </header>

            <form onSubmit={handleSubmit} className="flex flex-col gap-10">
                <section className="rounded-card border border-border bg-bg-card p-6 shadow-sm">
                    <div className="flex flex-wrap items-end justify-between gap-4">
                        <h2 className="font-display text-h3 text-text-primary">
                            {tSettings('schedule.title')}
                        </h2>
                        <Button type="button" variant="secondary" size="sm" onClick={addRow}>
                            {tSettings('schedule.addRow')}
                        </Button>
                    </div>

                    <fieldset className="mt-6 border-0 p-0">
                        <legend className="mb-3 block text-small font-medium text-text-primary">
                            {tSettings('schedule.emphasisLegend')}
                        </legend>
                        <p className="mb-4 text-small text-text-secondary">
                            {tSettings('schedule.emphasisHint')}
                        </p>
                        <div className="mb-6 rounded-pill border border-border bg-bg-section p-4">
                            <label className="flex cursor-pointer items-start gap-3">
                                <input
                                    type="radio"
                                    name="schedule-emphasis"
                                    className="mt-1 shrink-0"
                                    checked={!scheduleRows.some((r) => r.emphasis)}
                                    onChange={() =>
                                        setScheduleRows((prev) => clearAllEmphasis(prev))
                                    }
                                />
                                <span className="text-body text-text-primary">
                                    {tSettings('schedule.emphasisNone')}
                                </span>
                            </label>
                        </div>
                        <div className="flex flex-col gap-8">
                        {scheduleRows.map((row, index) => (
                            <div
                                key={`${row.id}-${index}`}
                                className={cn(
                                    'rounded-pill border border-border bg-bg-section p-4',
                                    duplicateIds.has(row.id) && 'border-primary-dark ring-2 ring-primary/30',
                                )}
                            >
                                <div className="mb-4 border-b border-border pb-4">
                                    <label className="flex cursor-pointer items-start gap-3">
                                        <input
                                            type="radio"
                                            name="schedule-emphasis"
                                            className="mt-1 shrink-0"
                                            checked={row.emphasis}
                                            onChange={() =>
                                                setScheduleRows((prev) =>
                                                    setEmphasisOnlyAt(prev, index),
                                                )
                                            }
                                            aria-label={tSettings('schedule.emphasisRowAria', {
                                                time: formatRowTimeLabel(row),
                                                segment: tSettings(
                                                    `segments.${segmentIdForRow(row)}`,
                                                ),
                                            })}
                                        />
                                        <span className="text-body text-text-primary">
                                            {tSettings('schedule.emphasisThisRow', {
                                                time: formatRowTimeLabel(row),
                                                segment: tSettings(
                                                    `segments.${segmentIdForRow(row)}`,
                                                ),
                                            })}
                                        </span>
                                    </label>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        disabled={index === 0}
                                        onClick={() => moveRow(index, -1)}
                                    >
                                        {tSettings('schedule.moveUp')}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        disabled={index === scheduleRows.length - 1}
                                        onClick={() => moveRow(index, 1)}
                                    >
                                        {tSettings('schedule.moveDown')}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => removeRow(index)}
                                    >
                                        {tSettings('schedule.removeRow')}
                                    </Button>
                                </div>

                                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                    <label className="flex flex-col gap-1">
                                        <span className="text-small font-medium text-text-primary">
                                            {tSettings('schedule.rowId')}
                                        </span>
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
                                            {tSettings('schedule.messagePreset')}
                                        </span>
                                        <select
                                            className="rounded-pill border border-border bg-bg-card px-4 py-3 text-body text-text-primary"
                                            value={segmentIdForRow(row)}
                                            onChange={(ev) => applyPreset(index, ev.target.value)}
                                        >
                                            {SCHEDULE_I18N_CATALOG.map((c) => (
                                                <option key={c.segmentId} value={c.segmentId}>
                                                    {tSettings(`segments.${c.segmentId}`)}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                    <label className="flex flex-col gap-1">
                                        <span className="text-small font-medium text-text-primary">
                                            {tSettings('schedule.icon')}
                                        </span>
                                        <select
                                            className="rounded-pill border border-border bg-bg-card px-4 py-3 text-body text-text-primary"
                                            value={safeIconIdForSelect(row.iconId)}
                                            onChange={(ev) =>
                                                updateRow(index, {...row, iconId: ev.target.value})
                                            }
                                        >
                                            {SCHEDULE_PROGRAM_ICON_IDS.map((id) => (
                                                <option key={id} value={id}>
                                                    {tSettings(`schedule.icons.${id}`)}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                    <div className="flex gap-2 sm:col-span-2">
                                        <label className="flex flex-1 flex-col gap-1">
                                            <span className="text-small font-medium text-text-primary">
                                                {tSettings('schedule.hour')}
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
                                                {tSettings('schedule.minute')}
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
                                            {tSettings('schedule.titleKey')}
                                        </span>
                                        <Input value={row.titleKey} readOnly className="opacity-80"/>
                                    </label>
                                    <label className="flex flex-col gap-1 sm:col-span-2">
                                        <span className="text-small font-medium text-text-primary">
                                            {tSettings('schedule.descKey')}
                                        </span>
                                        <Input value={row.descKey} readOnly className="opacity-80"/>
                                    </label>
                                    <label className="flex flex-col gap-1 sm:col-span-2">
                                        <span className="text-small font-medium text-text-primary">
                                            {tSettings('schedule.location')}
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
                                            {tSettings('schedule.locationUrl')}
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
                    </fieldset>
                </section>

                <div className="flex justify-end">
                    <Button type="submit" disabled={saving}>
                        {saving ? tPage('saving') : tPage('save')}
                    </Button>
                </div>
            </form>
        </div>
    )
}
