'use client'

import {useEffect, useRef} from 'react'
import {useTranslations} from 'next-intl'

import {Button} from '@shared/ui'
import {cn} from '@shared/lib/cn'

type GalleryDeleteConfirmDialogProps = {
    open: boolean
    isDeleting: boolean
    onConfirm: () => void | Promise<void>
    onCancel: () => void
}

/**
 * Native `<dialog>` confirmation — matches site tokens (`rounded-lg`, `shadow-modal`, `bg-bg-card`).
 */
export function GalleryDeleteConfirmDialog({
    open,
    isDeleting,
    onConfirm,
    onCancel,
}: GalleryDeleteConfirmDialogProps) {
    const t = useTranslations('gallery')
    const dialogRef = useRef<HTMLDialogElement>(null)

    useEffect(() => {
        const el = dialogRef.current
        if (!el) {
            return
        }
        if (open) {
            if (!el.open) {
                el.showModal()
            }
        } else if (el.open) {
            el.close()
        }
    }, [open])

    return (
        <dialog
            ref={dialogRef}
            className={cn(
                'fixed inset-0 z-[120] m-auto max-h-[min(90vh,32rem)] w-[min(100%-2rem,26rem)]',
                'rounded-lg border border-border bg-bg-card p-6 text-text-primary shadow-modal',
                'backdrop:bg-black/40 backdrop:backdrop-blur-[2px]',
            )}
            onClick={(e) => {
                if (e.target === dialogRef.current && !isDeleting) {
                    onCancel()
                }
            }}
            onCancel={(e) => {
                if (isDeleting) {
                    e.preventDefault()
                } else {
                    onCancel()
                }
            }}
        >
            <h2 className="font-display text-h3 text-text-primary">
                {t('deleteConfirmTitle')}
            </h2>
            <p className="mt-3 text-body text-text-secondary">
                {t('deleteConfirmDescription')}
            </p>
            <div className="mt-8 flex flex-wrap justify-end gap-3">
                <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={isDeleting}
                    onClick={() => {
                        if (!isDeleting) {
                            onCancel()
                        }
                    }}
                >
                    {t('deleteConfirmCancel')}
                </Button>
                <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    disabled={isDeleting}
                    onClick={() => void onConfirm()}
                >
                    {isDeleting ? t('deleteDeleting') : t('deleteConfirmSubmit')}
                </Button>
            </div>
        </dialog>
    )
}
