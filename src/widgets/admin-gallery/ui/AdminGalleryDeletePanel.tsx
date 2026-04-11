'use client'

import {useRouter} from '@/i18n/navigation'
import type {AdminGalleryPhotoRow} from '../model/types'
import {Button} from '@shared/ui/Button'
import {cn} from '@shared/lib/cn'
import Image from 'next/image'
import {useTranslations} from 'next-intl'
import {useEffect, useMemo, useRef, useState} from 'react'
import {toast} from 'sonner'

import {deleteAdminPhotos} from '../lib/delete-admin-photos'

type Props = Readonly<{
    photos: AdminGalleryPhotoRow[]
    hasMore: boolean
}>

export function AdminGalleryDeletePanel({photos, hasMore}: Props) {
    const router = useRouter()
    const t = useTranslations('admin.gallery')
    const tSettings = useTranslations('admin.settings')
    const [selected, setSelected] = useState<Set<string>>(() => new Set())
    const [deleting, setDeleting] = useState(false)
    const selectAllRef = useRef<HTMLInputElement>(null)

    const allIds = useMemo(() => photos.map((p) => p.id), [photos])

    const allSelected =
        photos.length > 0 && selected.size === photos.length
    const someSelected = selected.size > 0 && !allSelected

    useEffect(() => {
        const el = selectAllRef.current
        if (el) {
            el.indeterminate = someSelected
        }
    }, [someSelected])

    function toggleAll() {
        if (allSelected) {
            setSelected(new Set())
        } else {
            setSelected(new Set(allIds))
        }
    }

    function toggleOne(id: string) {
        setSelected((prev) => {
            const next = new Set(prev)
            if (next.has(id)) {
                next.delete(id)
            } else {
                next.add(id)
            }
            return next
        })
    }

    async function handleDelete() {
        if (selected.size === 0 || deleting) {
            return
        }
        if (!window.confirm(t('confirmDelete', {count: selected.size}))) {
            return
        }

        setDeleting(true)
        try {
            const result = await deleteAdminPhotos([...selected])

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
                    typeof (data as {retry_after: unknown}).retry_after ===
                        'number'
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
                toast.error(t('toastDeleteFailed'))
                return
            }

            toast.success(
                t('toastDeleted', {
                    count: result.deleted,
                }),
            )
            setSelected(new Set())
            router.refresh()
        } finally {
            setDeleting(false)
        }
    }

    return (
        <div>
            {hasMore ? (
                <p className="mb-4 text-small text-text-muted" role="status">
                    {t('hasMoreHint')}
                </p>
            ) : null}

            {photos.length > 0 ? (
                <div className="mb-4 flex flex-wrap items-center gap-3">
                    <Button
                        type="button"
                        variant="secondary"
                        disabled={deleting || selected.size === 0}
                        onClick={() => void handleDelete()}
                    >
                        {deleting ? t('deleting') : t('deleteSelected')}
                    </Button>
                    <span className="text-small text-text-secondary">
                        {t('countSelected', {count: selected.size})}
                    </span>
                </div>
            ) : null}

            {photos.length === 0 ? null : (
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] border-collapse text-left text-body">
                        <thead>
                            <tr className="border-b border-border text-small text-text-muted">
                                <th className="w-10 py-2 pr-2">
                                    <input
                                        ref={selectAllRef}
                                        type="checkbox"
                                        checked={allSelected}
                                        onChange={toggleAll}
                                        className={cn(
                                            'h-4 w-4 rounded border-border accent-primary',
                                        )}
                                        aria-label={t('selectAll')}
                                    />
                                </th>
                                <th className="py-2 pr-4 font-medium">
                                    {t('columns.thumbnail')}
                                </th>
                                <th className="py-2 pr-4 font-medium">
                                    {t('columns.uploader')}
                                </th>
                                <th className="py-2 pr-4 font-medium">
                                    {t('columns.uploadedAt')}
                                </th>
                                <th className="py-2 font-medium">
                                    {t('columns.rsvp')}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {photos.map((p) => (
                                <tr
                                    key={p.id}
                                    className="border-b border-border/80 align-middle last:border-0"
                                >
                                    <td className="py-3 pr-2">
                                        <input
                                            type="checkbox"
                                            checked={selected.has(p.id)}
                                            onChange={() => toggleOne(p.id)}
                                            className="h-4 w-4 rounded border-border accent-primary"
                                            aria-label={t('selectRow')}
                                        />
                                    </td>
                                    <td className="py-3 pr-4">
                                        <div
                                            className="relative h-14 w-14 overflow-hidden rounded-md border border-border bg-bg-section"
                                        >
                                            <Image
                                                src={p.publicUrl}
                                                alt=""
                                                fill
                                                sizes="56px"
                                                className="object-cover"
                                            />
                                        </div>
                                    </td>
                                    <td className="max-w-[12rem] py-3 pr-4 text-text-primary">
                                        {p.uploaderName ?? '—'}
                                    </td>
                                    <td className="py-3 pr-4 text-text-secondary whitespace-nowrap">
                                        {p.uploadedAtLabel}
                                    </td>
                                    <td className="max-w-[10rem] py-3 text-text-secondary font-mono text-small">
                                        <span className="line-clamp-2 break-all">
                                            {p.rsvpId ?? '—'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
