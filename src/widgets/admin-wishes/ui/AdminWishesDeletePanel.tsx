'use client'

import {useRouter} from '@/i18n/navigation'
import {Button} from '@shared/ui/Button'
import {cn} from '@shared/lib/cn'
import Image from 'next/image'
import {useTranslations} from 'next-intl'
import {useEffect, useMemo, useRef, useState} from 'react'
import {toast} from 'sonner'

import {deleteAdminWishes} from '../lib/delete-admin-wishes'
import type {AdminWishesTableRow} from '../model/types'

type Props = Readonly<{
    wishes: AdminWishesTableRow[]
    hasMore: boolean
}>

export function AdminWishesDeletePanel({wishes, hasMore}: Props) {
    const router = useRouter()
    const t = useTranslations('admin.wishes')
    const tSettings = useTranslations('admin.settings')
    const [selected, setSelected] = useState<Set<string>>(() => new Set())
    const [deleting, setDeleting] = useState(false)
    const selectAllRef = useRef<HTMLInputElement>(null)

    const allIds = useMemo(() => wishes.map((w) => w.id), [wishes])

    const allSelected =
        wishes.length > 0 && selected.size === wishes.length
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
            const result = await deleteAdminWishes([...selected])

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

            {wishes.length > 0 ? (
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

            {wishes.length === 0 ? null : (
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] border-collapse text-left text-body">
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
                                    {t('columns.photo')}
                                </th>
                                <th className="py-2 pr-4 font-medium">
                                    {t('columns.author')}
                                </th>
                                <th className="py-2 pr-4 font-medium">
                                    {t('columns.message')}
                                </th>
                                <th className="py-2 font-medium">
                                    {t('columns.createdAt')}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {wishes.map((w) => (
                                <tr
                                    key={w.id}
                                    className="border-b border-border/80 align-top last:border-0"
                                >
                                    <td className="py-3 pr-2">
                                        <input
                                            type="checkbox"
                                            checked={selected.has(w.id)}
                                            onChange={() => toggleOne(w.id)}
                                            className="h-4 w-4 rounded border-border accent-primary"
                                            aria-label={t('selectRow')}
                                        />
                                    </td>
                                    <td className="py-3 pr-4">
                                        {w.photoUrl ? (
                                            <div
                                                className="relative h-14 w-14 overflow-hidden rounded-md border border-border bg-bg-section"
                                            >
                                                <Image
                                                    src={w.photoUrl}
                                                    alt=""
                                                    fill
                                                    sizes="56px"
                                                    className="object-cover"
                                                />
                                            </div>
                                        ) : (
                                            <span className="text-text-muted">
                                                —
                                            </span>
                                        )}
                                    </td>
                                    <td className="max-w-[10rem] py-3 pr-4 text-text-primary">
                                        {w.authorName}
                                    </td>
                                    <td className="max-w-[20rem] py-3 pr-4 text-text-secondary">
                                        <span className="line-clamp-4 whitespace-pre-wrap break-words">
                                            {w.message}
                                        </span>
                                    </td>
                                    <td className="py-3 text-text-secondary whitespace-nowrap">
                                        {w.createdAtLabel}
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
