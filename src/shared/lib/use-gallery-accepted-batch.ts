'use client'

import {useTranslations} from 'next-intl'
import {toast} from 'sonner'

import {GALLERY_MAX_SOURCE_FILE_BYTES} from '@entities/photo'

import {partitionGalleryPhotoFiles} from './validate-gallery-photo-file'

const SOURCE_MAX_MB = Math.floor(
    GALLERY_MAX_SOURCE_FILE_BYTES / (1024 * 1024),
)

/**
 * Partitions raw `File[]` from picker/drop, shows one toast on first rejection, returns accepted files.
 */
export function useGalleryAcceptedBatch(): (raw: File[]) => File[] {
    const tu = useTranslations('upload')

    return (raw: File[]) => {
        const {accepted, firstReject} = partitionGalleryPhotoFiles(raw)
        if (firstReject) {
            toast.error(
                firstReject === 'source_oversize'
                    ? tu('photoSourceTooLarge', {maxMb: SOURCE_MAX_MB})
                    : tu('photoInvalidType'),
            )
        }
        return accepted
    }
}
