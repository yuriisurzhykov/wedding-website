'use client'

import {useRouter} from '@/i18n/navigation'
import {
    getWeddingSchedulePresetBySegmentId,
    SCHEDULE_ICON_PRESET_VALUES,
    SCHEDULE_ICON_SVG_UPLOAD_MAX_BYTES,
    WEDDING_SCHEDULE_ADMIN_PRESETS,
    type ScheduleItemRow,
    type WeddingScheduleReplaceItem,
} from '@entities/wedding-schedule'
import {cn} from '@shared/lib/cn'
import {Button} from '@shared/ui/Button'
import {Input} from '@shared/ui/Input'
import {useTranslations} from 'next-intl'
import {useEffect, useMemo, useRef, useState} from 'react'
import {toast} from 'sonner'

import {patchAdminSchedule} from '../lib/patch-admin-schedule'
import {uploadScheduleIconSvgToR2} from '../lib/upload-schedule-icon-svg'

/** Tight corners from `app/globals.css` — avoids pill-like stadium shapes next to native controls. */
const SCHEDULE_RADIUS_PANEL =
    'rounded-[var(--radius-sm)] border border-border bg-bg-card p-3'
const SCHEDULE_RADIUS_PANEL_MUTED =
    'rounded-[var(--radius-sm)] border border-border bg-bg-section p-3'
/** Native selects get OS “pill” chrome; `appearance-none` + chevron keeps corners matching the design radius. */
const SCHEDULE_NATIVE_SELECT =
    "w-full appearance-none rounded-[var(--radius-sm)] border border-border bg-bg-card bg-[length:1rem_1rem] bg-[position:right_0.65rem_center] bg-no-repeat px-3 py-2.5 pr-9 text-body text-text-primary bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23657567%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%2F%3E%3C%2Fsvg%3E')]"

function cloneRows(items: ScheduleItemRow[]): WeddingScheduleReplaceItem[] {
    return items.map((row) => ({
        id: row.id,
        hour: row.hour,
        minute: row.minute,
        title_ru: row.title_ru,
        title_en: row.title_en,
        desc_ru: row.desc_ru,
        desc_en: row.desc_en,
        location: row.location,
        location_url: row.location_url,
        emphasis: row.emphasis,
        icon_preset: row.icon_preset,
        icon_svg_inline: row.icon_svg_inline,
        icon_url: row.icon_url,
    }))
}

function segmentIdForRow(row: WeddingScheduleReplaceItem): string {
    const match = WEDDING_SCHEDULE_ADMIN_PRESETS.find(
        (c) =>
            c.title_ru === row.title_ru &&
            c.title_en === row.title_en &&
            c.desc_ru === row.desc_ru &&
            c.desc_en === row.desc_en,
    )
    return match?.segmentId ?? WEDDING_SCHEDULE_ADMIN_PRESETS[0].segmentId
}

function safeIconPresetForSelect(preset: string | null | undefined): string {
    const ids = SCHEDULE_ICON_PRESET_VALUES as readonly string[]
    return preset != null && ids.includes(preset) ? preset : SCHEDULE_ICON_PRESET_VALUES[0]
}

function defaultScheduleIconPreset(): NonNullable<WeddingScheduleReplaceItem['icon_preset']> {
    return SCHEDULE_ICON_PRESET_VALUES[0]
}

/**
 * Icon UI mode. Uses `icon_url === ''` as a client-only sentinel for “hosted” mode before a URL exists
 * (otherwise empty URL collapses back to preset and the file picker never appears).
 */
function scheduleRowIconKind(row: WeddingScheduleReplaceItem): 'preset' | 'url' | 'inline' {
    if (row.icon_svg_inline !== null && row.icon_svg_inline !== undefined) {
        return 'inline'
    }
    if (row.icon_preset != null) {
        return 'preset'
    }
    if (row.icon_url !== null && row.icon_url !== undefined) {
        return 'url'
    }
    return 'preset'
}

function clearAllEmphasis(rows: WeddingScheduleReplaceItem[]): WeddingScheduleReplaceItem[] {
    return rows.map((r) => ({...r, emphasis: false}))
}

function setEmphasisOnlyAt(
    rows: WeddingScheduleReplaceItem[],
    index: number,
): WeddingScheduleReplaceItem[] {
    return rows.map((r, i) => ({...r, emphasis: i === index}))
}

function formatRowTimeLabel(row: WeddingScheduleReplaceItem): string {
    const h = String(row.hour).padStart(2, '0')
    const m = String(row.minute).padStart(2, '0')
    return `${h}:${m}`
}

/** Maps `PATCH /api/admin/schedule` error strings to `admin.settings` message keys. */
const SCHEDULE_PATCH_ERROR_TO_I18N: Record<string, string> = {
    Unauthorized: 'errors.notSignedIn',
    'Invalid JSON body': 'errors.schedule.invalidJson',
    SCHEDULE_DUPLICATE_IDS: 'errors.schedule.duplicateIdsInPayload',
    SCHEDULE_MULTIPLE_EMPHASIS: 'errors.schedule.multipleEmphasisInPayload',
    SCHEDULE_ICON_EXCLUSIVE: 'errors.schedule.iconExclusive',
    SCHEDULE_ITEMS_EMPTY: 'errors.schedule.itemsEmpty',
    SCHEDULE_ITEMS_TOO_MANY: 'errors.schedule.itemsTooMany',
    SCHEDULE_HOUR_INVALID: 'errors.schedule.hourInvalid',
    SCHEDULE_MINUTE_INVALID: 'errors.schedule.minuteInvalid',
    SCHEDULE_TITLE_TOO_LONG: 'errors.schedule.titleTooLong',
    SCHEDULE_DESC_TOO_LONG: 'errors.schedule.descTooLong',
    SCHEDULE_LOCATION_TOO_LONG: 'errors.schedule.locationTooLong',
    SCHEDULE_LOCATION_URL_TOO_LONG: 'errors.schedule.locationUrlTooLong',
    SCHEDULE_ICON_SVG_TOO_LONG: 'errors.schedule.iconSvgTooLong',
    SCHEDULE_ICON_URL_TOO_LONG: 'errors.schedule.iconUrlTooLong',
    SCHEDULE_ICON_PRESET_INVALID: 'errors.schedule.iconPresetInvalid',
    SCHEDULE_ITEM_ID_INVALID: 'errors.schedule.itemIdInvalid',
    SCHEDULE_ITEM_FIELDS_INVALID: 'errors.schedule.itemFieldsInvalid',
    SCHEDULE_PERSISTENCE_FAILED: 'errors.schedule.persistenceFailed',
}

function translateSchedulePatchError(tSettings: (key: string) => string, raw: string): string {
    const path = SCHEDULE_PATCH_ERROR_TO_I18N[raw]
    if (path) {
        return tSettings(path)
    }
    return tSettings('errors.scheduleSaveFailed')
}

type Props = Readonly<{
    initialItems: ScheduleItemRow[]
    sectionUpdatedAt: string
}>

export function AdminScheduleForm({initialItems, sectionUpdatedAt}: Props) {
    const tPage = useTranslations('admin.schedulePage')
    const tSettings = useTranslations('admin.settings')

    const router = useRouter()

    const [scheduleRows, setScheduleRows] = useState(() => cloneRows(initialItems))
    const [saving, setSaving] = useState(false)
    const [updatedAt, setUpdatedAt] = useState(sectionUpdatedAt)
    const [iconUploadRowIndex, setIconUploadRowIndex] = useState<number | null>(null)
    const [uploadingIconIndex, setUploadingIconIndex] = useState<number | null>(null)
    const scheduleIconFileInputRef = useRef<HTMLInputElement>(null)
    /** Parallel to `scheduleRows`: whether the row body is expanded (header always visible). */
    const [rowExpanded, setRowExpanded] = useState<boolean[]>(() => initialItems.map(() => true))

    const lastSyncedServerAt = useRef(sectionUpdatedAt)
    useEffect(() => {
        if (sectionUpdatedAt === lastSyncedServerAt.current) {
            return
        }
        lastSyncedServerAt.current = sectionUpdatedAt
        setUpdatedAt(sectionUpdatedAt)
        setScheduleRows(cloneRows(initialItems))
        setRowExpanded(new Array(initialItems.length).fill(true))
    }, [initialItems, sectionUpdatedAt])

    function updateRow(index: number, row: WeddingScheduleReplaceItem) {
        setScheduleRows((prev) => {
            const next = [...prev]
            next[index] = row
            return next
        })
    }

    function applyPreset(index: number, segmentId: string) {
        const entry = getWeddingSchedulePresetBySegmentId(segmentId)
        if (!entry) {
            return
        }
        const row = scheduleRows[index]
        if (!row) {
            return
        }
        updateRow(index, {
            ...row,
            icon_preset: entry.icon_preset,
            icon_svg_inline: null,
            icon_url: null,
            title_ru: entry.title_ru,
            title_en: entry.title_en,
            desc_ru: entry.desc_ru,
            desc_en: entry.desc_en,
        })
    }

    function addRow() {
        const template = WEDDING_SCHEDULE_ADMIN_PRESETS[0]
        setScheduleRows((prev) => [
            ...prev,
            {
                id: crypto.randomUUID(),
                hour: 14,
                minute: 0,
                title_ru: template.title_ru,
                title_en: template.title_en,
                desc_ru: template.desc_ru,
                desc_en: template.desc_en,
                location: '',
                location_url: '',
                emphasis: false,
                icon_preset: template.icon_preset,
                icon_svg_inline: null,
                icon_url: null,
            },
        ])
        setRowExpanded((prev) => [...prev, true])
    }

    function removeRow(index: number) {
        setScheduleRows((prev) => prev.filter((_, i) => i !== index))
        setRowExpanded((prev) => prev.filter((_, i) => i !== index))
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
        setRowExpanded((prev) => {
            const next = [...prev]
            ;[next[index], next[j]] = [next[j], next[index]]
            return next
        })
    }

    function toggleRowExpanded(index: number) {
        setRowExpanded((prev) => {
            const next = [...prev]
            next[index] = !next[index]
            return next
        })
    }

    const maxScheduleSvgKb = Math.ceil(SCHEDULE_ICON_SVG_UPLOAD_MAX_BYTES / 1024)

    async function handleScheduleIconFileChange(ev: React.ChangeEvent<HTMLInputElement>) {
        const idx = iconUploadRowIndex
        const file = ev.target.files?.[0]
        ev.target.value = ''
        setIconUploadRowIndex(null)
        if (idx === null || !file) {
            return
        }

        setUploadingIconIndex(idx)
        try {
            const result = await uploadScheduleIconSvgToR2(file)
            if (!result.ok) {
                if (result.code === 'invalid_file') {
                    toast.error(
                        tSettings('schedule.uploadSvgInvalidFile', {maxKb: maxScheduleSvgKb}),
                    )
                } else if (result.code === 'unauthorized') {
                    toast.error(tSettings('schedule.uploadSvgUnauthorized'))
                } else {
                    toast.error(tSettings('schedule.uploadSvgFailed'))
                }
                return
            }
            setScheduleRows((prev) => {
                const row = prev[idx]
                if (!row) {
                    return prev
                }
                const next = [...prev]
                next[idx] = {
                    ...row,
                    icon_url: result.publicUrl,
                    icon_preset: null,
                    icon_svg_inline: null,
                }
                return next
            })
            toast.success(tSettings('schedule.uploadSvgSuccess'))
        } finally {
            setUploadingIconIndex(null)
        }
    }

    const duplicateIds = useMemo(() => {
        const counts = new Map<string, number>()
        for (const row of scheduleRows) {
            if (row.id) {
                counts.set(row.id, (counts.get(row.id) ?? 0) + 1)
            }
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

        for (let i = 0; i < scheduleRows.length; i++) {
            const row = scheduleRows[i]
            if (!row) {
                continue
            }
            const kind = scheduleRowIconKind(row)
            if (kind === 'url' && !row.icon_url?.trim()) {
                toast.error(
                    tSettings('errors.schedule.iconHostedNeedsUrlOrUpload', {
                        row: i + 1,
                    }),
                )
                return
            }
            if (kind === 'inline' && !row.icon_svg_inline?.trim()) {
                toast.error(
                    tSettings('errors.schedule.iconInlineNeedsSvg', {
                        row: i + 1,
                    }),
                )
                return
            }
        }

        setSaving(true)
        try {
            const result = await patchAdminSchedule({items: scheduleRows})

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
                        : ''
                toast.error(msg ? translateSchedulePatchError(tSettings, msg) : tSettings('errors.scheduleSaveFailed'))
                return
            }

            if (result.updated_at) {
                setUpdatedAt(result.updated_at)
            }

            toast.success(tPage('toast.saved'))
            router.refresh()
        } catch {
            toast.error(tSettings('errors.scheduleSaveFailed'))
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
                <input
                    ref={scheduleIconFileInputRef}
                    type="file"
                    accept=".svg,image/svg+xml"
                    className="sr-only"
                    tabIndex={-1}
                    aria-hidden
                    onChange={handleScheduleIconFileChange}
                />
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
                        <div className="mb-6 rounded-lg border border-border bg-bg-section p-4">
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
                        <div className="flex flex-col gap-4">
                            {scheduleRows.map((row, index) => {
                                const iconKind = scheduleRowIconKind(row)
                                const isOpen = rowExpanded[index] ?? true
                                const previewTitle =
                                    row.title_en.trim() !== ''
                                        ? row.title_en
                                        : row.title_ru.trim() !== ''
                                          ? row.title_ru
                                          : '—'
                                return (
                                <div
                                    key={row.id ?? `${index}`}
                                    className={cn(
                                        'overflow-hidden rounded-lg border border-border bg-bg-section',
                                        row.id && duplicateIds.has(row.id) &&
                                            'border-primary-dark ring-2 ring-primary/30',
                                    )}
                                >
                                    <div className="flex flex-wrap items-center gap-2 border-b border-border bg-bg-card px-3 py-2 sm:px-4">
                                        <button
                                            type="button"
                                            className="flex min-w-0 flex-1 items-center gap-2 rounded-md py-1 text-left outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-primary"
                                            aria-expanded={isOpen}
                                            aria-label={
                                                isOpen
                                                    ? tSettings('schedule.collapseItem')
                                                    : tSettings('schedule.expandItem')
                                            }
                                            onClick={() => toggleRowExpanded(index)}
                                        >
                                            <span
                                                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border bg-bg-section text-small text-text-secondary"
                                                aria-hidden
                                            >
                                                {isOpen ? '▼' : '▶'}
                                            </span>
                                            <span className="shrink-0 font-mono text-small text-text-secondary">
                                                {formatRowTimeLabel(row)}
                                            </span>
                                            <span className="min-w-0 truncate text-body font-medium text-text-primary">
                                                {previewTitle}
                                            </span>
                                            {row.emphasis ? (
                                                <span className="shrink-0 rounded-md border border-primary/40 px-2 py-0.5 text-small font-medium text-primary">
                                                    {tSettings('schedule.mainMomentBadge')}
                                                </span>
                                            ) : null}
                                        </button>
                                        <div className="flex shrink-0 flex-wrap items-center gap-2">
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
                                    </div>
                                    {isOpen ? (
                                    <div className="p-4">
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

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <label className="flex flex-col gap-1">
                                            <span className="text-small font-medium text-text-primary">
                                                {tSettings('schedule.rowId')}
                                            </span>
                                            <Input
                                                value={row.id ?? ''}
                                                onChange={(ev) =>
                                                    updateRow(index, {
                                                        ...row,
                                                        id: ev.target.value || undefined,
                                                    })
                                                }
                                                autoComplete="off"
                                            />
                                        </label>
                                        <label className="flex flex-col gap-1">
                                            <span className="text-small font-medium text-text-primary">
                                                {tSettings('schedule.messagePreset')}
                                            </span>
                                            <select
                                                className={SCHEDULE_NATIVE_SELECT}
                                                value={segmentIdForRow(row)}
                                                onChange={(ev) => applyPreset(index, ev.target.value)}
                                            >
                                                {WEDDING_SCHEDULE_ADMIN_PRESETS.map((c) => (
                                                    <option key={c.segmentId} value={c.segmentId}>
                                                        {tSettings(`segments.${c.segmentId}`)}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>
                                        <div className="flex flex-col gap-3 sm:col-span-2">
                                            <span className="text-small font-medium text-text-primary">
                                                {tSettings('schedule.icon')}
                                            </span>
                                            {iconKind === 'inline' ? (
                                                <div className={SCHEDULE_RADIUS_PANEL}>
                                                    <label className="flex flex-col gap-1">
                                                        <span className="text-small font-medium text-text-primary">
                                                            {tSettings('schedule.inlineSvgLabel')}
                                                        </span>
                                                        <textarea
                                                            className="min-h-[140px] w-full rounded-[var(--radius-sm)] border border-border bg-bg-section px-3 py-2.5 font-mono text-small text-text-primary"
                                                            spellCheck={false}
                                                            value={row.icon_svg_inline ?? ''}
                                                            onChange={(ev) =>
                                                                updateRow(index, {
                                                                    ...row,
                                                                    icon_preset: null,
                                                                    icon_url: null,
                                                                    icon_svg_inline: ev.target.value,
                                                                })
                                                            }
                                                            placeholder={tSettings(
                                                                'schedule.inlineSvgPlaceholder',
                                                            )}
                                                        />
                                                    </label>
                                                    <p className="mt-3 text-body text-text-secondary">
                                                        {tSettings('schedule.inlineSvgNotice')}
                                                    </p>
                                                    <div className="mt-3 flex flex-wrap gap-2">
                                                        <Button
                                                            type="button"
                                                            variant="secondary"
                                                            size="sm"
                                                            onClick={() =>
                                                                updateRow(index, {
                                                                    ...row,
                                                                    icon_svg_inline: null,
                                                                    icon_url: null,
                                                                    icon_preset: defaultScheduleIconPreset(),
                                                                })
                                                            }
                                                        >
                                                            {tSettings('schedule.inlineToBuiltin')}
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() =>
                                                                updateRow(index, {
                                                                    ...row,
                                                                    icon_svg_inline: null,
                                                                    icon_preset: null,
                                                                    icon_url: row.icon_url?.trim()
                                                                        ? row.icon_url
                                                                        : '',
                                                                })
                                                            }
                                                        >
                                                            {tSettings('schedule.inlineToHosted')}
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <fieldset
                                                        className={`flex flex-col gap-2.5 ${SCHEDULE_RADIUS_PANEL_MUTED}`}
                                                    >
                                                        <legend className="sr-only">
                                                            {tSettings('schedule.icon')}
                                                        </legend>
                                                        <label className="flex cursor-pointer items-start gap-3">
                                                            <input
                                                                type="radio"
                                                                name={`schedule-row-icon-${row.id ?? String(index)}`}
                                                                className="mt-1 shrink-0"
                                                                checked={iconKind === 'preset'}
                                                                onChange={() =>
                                                                    updateRow(index, {
                                                                        ...row,
                                                                        icon_preset:
                                                                            row.icon_preset &&
                                                                            (
                                                                                SCHEDULE_ICON_PRESET_VALUES as readonly string[]
                                                                            ).includes(row.icon_preset)
                                                                                ? row.icon_preset
                                                                                : defaultScheduleIconPreset(),
                                                                        icon_svg_inline: null,
                                                                        icon_url: null,
                                                                    })
                                                                }
                                                            />
                                                            <span className="text-body text-text-primary">
                                                                {tSettings('schedule.iconKindPreset')}
                                                            </span>
                                                        </label>
                                                        <label className="flex cursor-pointer items-start gap-3">
                                                            <input
                                                                type="radio"
                                                                name={`schedule-row-icon-${row.id ?? String(index)}`}
                                                                className="mt-1 shrink-0"
                                                                checked={
                                                                    scheduleRowIconKind(row) === 'inline'
                                                                }
                                                                onChange={() =>
                                                                    updateRow(index, {
                                                                        ...row,
                                                                        icon_preset: null,
                                                                        icon_url: null,
                                                                        icon_svg_inline: row.icon_svg_inline?.trim()
                                                                            ? row.icon_svg_inline
                                                                            : '',
                                                                    })
                                                                }
                                                            />
                                                            <span className="text-body text-text-primary">
                                                                {tSettings('schedule.iconKindInline')}
                                                            </span>
                                                        </label>
                                                        <label className="flex cursor-pointer items-start gap-3">
                                                            <input
                                                                type="radio"
                                                                name={`schedule-row-icon-${row.id ?? String(index)}`}
                                                                className="mt-1 shrink-0"
                                                                checked={iconKind === 'url'}
                                                                onChange={() =>
                                                                    updateRow(index, {
                                                                        ...row,
                                                                        icon_preset: null,
                                                                        icon_svg_inline: null,
                                                                        icon_url: row.icon_url?.trim()
                                                                            ? row.icon_url
                                                                            : '',
                                                                    })
                                                                }
                                                            />
                                                            <span className="text-body text-text-primary">
                                                                {tSettings('schedule.iconKindHosted')}
                                                            </span>
                                                        </label>
                                                    </fieldset>
                                                    {iconKind === 'preset' ? (
                                                        <select
                                                            className={SCHEDULE_NATIVE_SELECT}
                                                            value={safeIconPresetForSelect(row.icon_preset)}
                                                            onChange={(ev) =>
                                                                updateRow(index, {
                                                                    ...row,
                                                                    icon_preset: ev.target
                                                                        .value as WeddingScheduleReplaceItem['icon_preset'],
                                                                    icon_svg_inline: null,
                                                                    icon_url: null,
                                                                })
                                                            }
                                                        >
                                                            {SCHEDULE_ICON_PRESET_VALUES.map((id) => (
                                                                <option key={id} value={id}>
                                                                    {tSettings(`schedule.icons.${id}`)}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    ) : (
                                                        <div className="flex flex-col gap-3">
                                                            <label className="flex flex-col gap-1">
                                                                <span className="text-small font-medium text-text-primary">
                                                                    {tSettings('schedule.iconUrlLabel')}
                                                                </span>
                                                                <Input
                                                                    placeholder={tSettings(
                                                                        'schedule.iconUrlPlaceholder',
                                                                    )}
                                                                    value={row.icon_url ?? ''}
                                                                    onChange={(ev) => {
                                                                        const v = ev.target.value
                                                                        updateRow(index, {
                                                                            ...row,
                                                                            icon_preset: null,
                                                                            icon_svg_inline: null,
                                                                            icon_url:
                                                                                v.trim() === '' ? '' : v,
                                                                        })
                                                                    }}
                                                                    autoComplete="off"
                                                                />
                                                            </label>
                                                            <div className="flex flex-wrap gap-2">
                                                                <Button
                                                                    type="button"
                                                                    variant="secondary"
                                                                    size="sm"
                                                                    disabled={uploadingIconIndex === index}
                                                                    onClick={() => {
                                                                        setIconUploadRowIndex(index)
                                                                        queueMicrotask(() =>
                                                                            scheduleIconFileInputRef.current?.click(),
                                                                        )
                                                                    }}
                                                                >
                                                                    {uploadingIconIndex === index
                                                                        ? tSettings('schedule.uploadingSvg')
                                                                        : tSettings('schedule.uploadSvg')}
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() =>
                                                                        updateRow(index, {
                                                                            ...row,
                                                                            icon_url: null,
                                                                            icon_preset: defaultScheduleIconPreset(),
                                                                            icon_svg_inline: null,
                                                                        })
                                                                    }
                                                                >
                                                                    {tSettings('schedule.clearHostedIcon')}
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
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
                                                {tSettings('schedule.titleRu')}
                                            </span>
                                            <Input
                                                value={row.title_ru}
                                                onChange={(ev) =>
                                                    updateRow(index, {...row, title_ru: ev.target.value})
                                                }
                                            />
                                        </label>
                                        <label className="flex flex-col gap-1 sm:col-span-2">
                                            <span className="text-small font-medium text-text-primary">
                                                {tSettings('schedule.titleEn')}
                                            </span>
                                            <Input
                                                value={row.title_en}
                                                onChange={(ev) =>
                                                    updateRow(index, {...row, title_en: ev.target.value})
                                                }
                                            />
                                        </label>
                                        <label className="flex flex-col gap-1 sm:col-span-2">
                                            <span className="text-small font-medium text-text-primary">
                                                {tSettings('schedule.descRu')}
                                            </span>
                                            <textarea
                                                className="min-h-[88px] rounded-md border border-border bg-bg-card px-4 py-3 text-body text-text-primary"
                                                value={row.desc_ru}
                                                onChange={(ev) =>
                                                    updateRow(index, {...row, desc_ru: ev.target.value})
                                                }
                                            />
                                        </label>
                                        <label className="flex flex-col gap-1 sm:col-span-2">
                                            <span className="text-small font-medium text-text-primary">
                                                {tSettings('schedule.descEn')}
                                            </span>
                                            <textarea
                                                className="min-h-[88px] rounded-md border border-border bg-bg-card px-4 py-3 text-body text-text-primary"
                                                value={row.desc_en}
                                                onChange={(ev) =>
                                                    updateRow(index, {...row, desc_en: ev.target.value})
                                                }
                                            />
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
                                                value={row.location_url}
                                                onChange={(ev) =>
                                                    updateRow(index, {
                                                        ...row,
                                                        location_url: ev.target.value,
                                                    })
                                                }
                                            />
                                        </label>
                                    </div>
                                    </div>
                                    ) : null}
                                </div>
                                )
                            })}
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
