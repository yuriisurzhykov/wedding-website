'use client'

import {forwardRef} from 'react'
import {useTranslations} from 'next-intl'
import {toast} from 'sonner'

import {GALLERY_MAX_FILE_BYTES, GALLERY_MAX_SOURCE_FILE_BYTES, GALLERY_PHOTO_FILE_ACCEPT,} from '@entities/photo'
import {cn} from '@shared/lib/cn'
import {useGalleryAcceptedBatch} from '@shared/lib/use-gallery-accepted-batch'
import {validateGalleryPhotoFile} from '@shared/lib/validate-gallery-photo-file'

const MAX_MB = Math.floor(GALLERY_MAX_FILE_BYTES / (1024 * 1024))
const SOURCE_MAX_MB = Math.floor(
    GALLERY_MAX_SOURCE_FILE_BYTES / (1024 * 1024),
)

export type PhotoFileInputProps = {
    id: string
    className?: string
    /** Single-file mode only: hint under label. */
    showHint?: boolean
    disabled?: boolean
    'aria-describedby'?: string
} & (
    | {
    multiple?: false | undefined
    onFileChange: (file: File | null) => void
}
    | {
    multiple: true
    onBatchAccepted: (files: File[]) => void
}
    )

/**
 * The only `<input type="file">` for gallery/wish photo rules: size + type, toast on reject.
 * Use `multiple` for batch picking (gallery); default is single file (wishes).
 */
export const PhotoFileInput = forwardRef<HTMLInputElement, PhotoFileInputProps>(
    function PhotoFileInput(props, ref) {
        const {
            id,
            className,
            showHint = false,
            disabled = false,
            'aria-describedby': ariaDescribedBy,
        } = props
        const t = useTranslations('upload')
        const toAccepted = useGalleryAcceptedBatch()

        function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
            if (disabled) {
                return
            }
            const input = e.target
            if (props.multiple) {
                const accepted = toAccepted(Array.from(input.files ?? []))
                props.onBatchAccepted(accepted)
                input.value = ''
                return
            }

            const f = input.files?.[0] ?? null
            if (!f) {
                props.onFileChange(null)
                return
            }
            const v = validateGalleryPhotoFile(f)
            if (!v.ok) {
                if (v.reason === 'source_oversize') {
                    toast.error(t('photoSourceTooLarge', {maxMb: SOURCE_MAX_MB}))
                } else {
                    toast.error(t('photoInvalidType'))
                }
                input.value = ''
                return
            }
            props.onFileChange(f)
        }

        const isMulti = 'multiple' in props && props.multiple === true

        return (
            <>
                {showHint && !isMulti ? (
                    <p className="text-small text-text-muted">
                        {t('photoSizeHint', {maxMb: MAX_MB})}
                    </p>
                ) : null}
                <input
                    ref={ref}
                    id={id}
                    name={id}
                    type="file"
                    multiple={isMulti}
                    accept={GALLERY_PHOTO_FILE_ACCEPT}
                    disabled={disabled}
                    aria-disabled={disabled ? true : undefined}
                    aria-describedby={ariaDescribedBy}
                    className={cn(
                        className,
                        disabled && 'cursor-not-allowed opacity-60',
                    )}
                    onChange={handleChange}
                />
            </>
        )
    },
)
