'use client'

import React, {useCallback, useRef, useState} from 'react'
import {useTranslations} from 'next-intl'
import {toast} from 'sonner'

import {GALLERY_MAX_FILE_BYTES, GALLERY_MAX_SOURCE_FILE_BYTES,} from '@entities/photo'
import {cn} from '@shared/lib/cn'
import {formatUploadApiErrorResponse} from '@shared/lib/format-upload-api-error'
import {postMultipartGalleryPhoto} from '@shared/lib/gallery-client-upload'
import {resolveGalleryImageContentType} from '@shared/lib/gallery-image-content-type'
import {GALLERY_USE_SERVER_MULTIPART_UPLOAD} from '@shared/lib/gallery-upload-mode'
import {GalleryPhotoPrepareError, prepareGalleryPhotoFileForUpload,} from '@shared/lib/prepare-gallery-photo-for-upload'
import {useGalleryAcceptedBatch} from '@shared/lib/use-gallery-accepted-batch'

import {Button} from './Button'
import {Input} from './Input'
import {PhotoFileInput} from './PhotoFileInput'

const MAX_PARALLEL = 3
const UPLOAD_MAX_MB = Math.floor(GALLERY_MAX_FILE_BYTES / (1024 * 1024))
const SOURCE_MAX_MB = Math.floor(
    GALLERY_MAX_SOURCE_FILE_BYTES / (1024 * 1024),
)

type FileStatus = 'pending' | 'uploading' | 'done' | 'error'

interface UploadFile {
    file: File
    status: FileStatus
    progress: number
}

export type PhotoUploadAdapter = (
    file: File,
    uploaderName: string,
    onProgress: (p: number) => void,
    options?: { purpose?: "gallery" | "wish" },
) => Promise<void>

/**
 * Direct browser→R2 (presign → PUT → confirm). Requires CORS on the R2 bucket (`docs/r2-cors.md`).
 */
export async function presignedPhotoUploadAdapter(
    file: File,
    uploaderName: string,
    onProgress: (p: number) => void,
    options?: { purpose?: "gallery" | "wish" },
): Promise<void> {
    const uploadFile = await prepareGalleryPhotoFileForUpload(file)
    const contentType = resolveGalleryImageContentType(uploadFile)
    if (!contentType) {
        throw new Error(
            'Unsupported or unknown image type. Use JPEG, PNG, WebP, or HEIC.',
        )
    }

    const presignRes = await fetch('/api/upload/presign', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        credentials: 'same-origin',
        body: JSON.stringify({
            contentType,
            size: uploadFile.size,
            purpose: options?.purpose ?? "gallery",
        }),
    })
    if (!presignRes.ok) {
        const detail = await formatUploadApiErrorResponse(presignRes)
        throw new Error(`Presign failed: ${detail}`)
    }
    const {url, key} = (await presignRes.json()) as { url: string; key: string }
    onProgress(30)

    const uploadRes = await fetch(url, {
        method: 'PUT',
        headers: {'Content-Type': contentType},
        body: uploadFile,
    })
    if (!uploadRes.ok) {
        const detail = await uploadRes.text().catch(() => uploadRes.statusText)
        throw new Error(
            `Upload to storage failed (${uploadRes.status}). ${detail.slice(0, 120)}`,
        )
    }
    onProgress(80)

    const confirmRes = await fetch('/api/upload/confirm', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        credentials: 'same-origin',
        body: JSON.stringify({
            key,
            uploaderName,
            sizeBytes: uploadFile.size,
            purpose: options?.purpose ?? "gallery",
        }),
    })
    if (!confirmRes.ok) {
        const detail = await formatUploadApiErrorResponse(confirmRes)
        throw new Error(`Confirm failed: ${detail}`)
    }
    onProgress(100)
}

/** Same-origin upload through Next.js (no R2 CORS). Enable with `NEXT_PUBLIC_GALLERY_SERVER_UPLOAD=true`. */
export async function serverPhotoUploadAdapter(
    file: File,
    uploaderName: string,
    onProgress: (p: number) => void,
    options?: { purpose?: "gallery" | "wish" },
): Promise<void> {
    const uploadFile = await prepareGalleryPhotoFileForUpload(file)
    await postMultipartGalleryPhoto(
        uploadFile,
        uploaderName,
        onProgress,
        options,
    )
}

/** Default: presigned R2; server multipart if `NEXT_PUBLIC_GALLERY_SERVER_UPLOAD=true`. */
export const defaultPhotoUploadAdapter: PhotoUploadAdapter =
    GALLERY_USE_SERVER_MULTIPART_UPLOAD
        ? serverPhotoUploadAdapter
        : presignedPhotoUploadAdapter

/** Simulated progress for demos / component book when API is unavailable. */
/**
 * When set (e.g. from {@link GalleryPhotosClient}), aligns with guest session: hide manual name
 * when authenticated, skeleton while loading, prompt when anonymous (plan §3.1).
 */
export type PhotoUploaderGuestSession =
    | { status: 'loading' }
    | { status: 'anonymous' }
    | { status: 'authenticated'; displayName: string }

export async function mockPhotoUploadAdapter(
    _file: File,
    _uploaderName: string,
    onProgress: (p: number) => void,
    _options?: { purpose?: "gallery" | "wish" },
): Promise<void> {
    await new Promise((r) => setTimeout(r, 200))
    onProgress(35)
    await new Promise((r) => setTimeout(r, 250))
    onProgress(72)
    await new Promise((r) => setTimeout(r, 200))
    onProgress(100)
}

export function PhotoUploader({
                                  uploadAdapter = defaultPhotoUploadAdapter,
                                  onUploadSuccess,
                                  guestUpload,
                                  suppressAnonymousHelpText = false,
                                  uploadMediaPurpose = "gallery",
                                  celebrationLocked = false,
                              }: {
    uploadAdapter?: PhotoUploadAdapter
    /** Called after at least one file uploaded successfully (e.g. refetch gallery list). */
    onUploadSuccess?: () => void | Promise<void>
    /** Guest session from a widget (`useGuestSession`). Omit in UI book / demos — manual name field stays. */
    guestUpload?: PhotoUploaderGuestSession
    /** When true and guest is anonymous, hide the default “sign in to upload” line (caller shows custom copy). */
    suppressAnonymousHelpText?: boolean
    /** Presign/confirm `purpose` — gallery shared album vs wish attachment (celebration rules differ). */
    uploadMediaPurpose?: "gallery" | "wish"
    /** When true, dropzone and upload are disabled (e.g. before celebration start for the gallery). */
    celebrationLocked?: boolean
}) {
    const t = useTranslations('gallery')
    const tu = useTranslations('upload')
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [files, setFiles] = useState<UploadFile[]>([])
    const [name, setName] = useState('')
    const [isDragging, setDragging] = useState(false)
    const toAccepted = useGalleryAcceptedBatch()

    const showNameSkeleton = guestUpload?.status === 'loading'
    /** UI book / no provider: manual name. With guest session, only `anonymous` uses manual name elsewhere — gallery blocks upload until session exists. */
    const needsManualName = guestUpload === undefined
    const sessionAuthenticated = guestUpload?.status === 'authenticated'
    const uploadBlocked =
        guestUpload?.status === 'anonymous' || celebrationLocked
    const sessionLabel =
        guestUpload?.status === 'authenticated' ? guestUpload.displayName : ''

    const appendAcceptedFiles = useCallback((accepted: File[]) => {
        if (accepted.length === 0) {
            return
        }
        setFiles((prev) => [
            ...prev,
            ...accepted.map((file) => ({
                file,
                status: 'pending' as FileStatus,
                progress: 0,
            })),
        ])
    }, [])

    function handleDrop(e: React.DragEvent) {
        e.preventDefault()
        setDragging(false)
        if (uploadBlocked || showNameSkeleton) {
            return
        }
        appendAcceptedFiles(toAccepted(Array.from(e.dataTransfer.files)))
    }

    function updateFile(index: number, updates: Partial<UploadFile>) {
        setFiles((prev) => prev.map((f, i) => (i === index ? {...f, ...updates} : f)))
    }

    async function handleUpload() {
        if (files.length === 0 || showNameSkeleton || uploadBlocked) {
            return
        }

        const labelForAdapter =
            sessionAuthenticated && sessionLabel
                ? sessionLabel
                : name.trim()
        if (!sessionAuthenticated && !labelForAdapter) {
            return
        }

        const pending = files
            .map((f, i) => ({...f, index: i}))
            .filter((f) => f.status === 'pending')

        let successCount = 0

        for (let i = 0; i < pending.length; i += MAX_PARALLEL) {
            const batch = pending.slice(i, i + MAX_PARALLEL)
            await Promise.all(
                batch.map(({file, index}) => {
                    updateFile(index, {status: 'uploading'})
                    return uploadAdapter(
                        file,
                        labelForAdapter,
                        (p) => updateFile(index, {progress: p}),
                        {purpose: uploadMediaPurpose},
                    )
                        .then(() => {
                            updateFile(index, {status: 'done', progress: 100})
                            successCount += 1
                        })
                        .catch((err: unknown) => {
                            updateFile(index, {status: 'error'})
                            if (err instanceof GalleryPhotoPrepareError) {
                                if (err.kind === 'source_too_large') {
                                    toast.error(
                                        tu('photoSourceTooLarge', {
                                            maxMb: SOURCE_MAX_MB,
                                        }),
                                    )
                                } else if (err.kind === 'output_too_large') {
                                    toast.error(
                                        tu('photoStillTooLarge', {
                                            maxMb: UPLOAD_MAX_MB,
                                        }),
                                    )
                                } else {
                                    toast.error(tu('photoOptimizeFailed'))
                                }
                            }
                        })
                }),
            )
        }

        if (successCount > 0) {
            await onUploadSuccess?.()
            setFiles([])
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
            toast.success(t('done'))
        }
    }

    const canStartUpload =
        files.length > 0 &&
        !showNameSkeleton &&
        !uploadBlocked &&
        (sessionAuthenticated ? Boolean(sessionLabel) : Boolean(name.trim()))

    return (
        <div className="flex flex-col gap-5">
            {showNameSkeleton ? (
                <div className="flex flex-col gap-2" aria-hidden>
                    <div className="h-4 w-28 max-w-[40%] animate-pulse rounded bg-bg-section"/>
                    <div className="h-10 w-full animate-pulse rounded-xl bg-bg-section"/>
                </div>
            ) : needsManualName ? (
                <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('uploaderName')}
                />
            ) : sessionAuthenticated ? (
                <p className="text-small text-text-secondary">{t('signedInAs', {name: sessionLabel})}</p>
            ) : null}

            {celebrationLocked ? (
                <p className="text-small text-text-secondary">{t('celebrationLockedHint')}</p>
            ) : guestUpload?.status === 'anonymous' && !suppressAnonymousHelpText ? (
                <p className="text-small text-text-secondary">{t('uploadSessionRequired')}</p>
            ) : null}

            <div
                role="button"
                tabIndex={uploadBlocked ? -1 : 0}
                onDrop={handleDrop}
                onDragOver={(e) => {
                    e.preventDefault()
                    if (!uploadBlocked && !showNameSkeleton) {
                        setDragging(true)
                    }
                }}
                onDragLeave={() => setDragging(false)}
                onClick={() => {
                    if (!uploadBlocked && !showNameSkeleton) {
                        fileInputRef.current?.click()
                    }
                }}
                onKeyDown={(e) => {
                    if (uploadBlocked || showNameSkeleton) {
                        return
                    }
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        fileInputRef.current?.click()
                    }
                }}
                aria-label={t('dropzone')}
                aria-disabled={uploadBlocked || showNameSkeleton}
                className={cn(
                    'rounded-lg border-2 border-dashed p-10 text-center transition-colors duration-fast',
                    uploadBlocked || showNameSkeleton
                        ? 'cursor-not-allowed opacity-60'
                        : 'cursor-pointer',
                    !uploadBlocked &&
                    !showNameSkeleton &&
                    (isDragging
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50 hover:bg-bg-section'),
                )}
            >
                <p className="mb-1 text-text-secondary">{t('dropzone')}</p>
                <p className="text-small text-text-muted">
                    {t('maxSize', {maxMb: UPLOAD_MAX_MB})}
                </p>
                <PhotoFileInput
                    ref={fileInputRef}
                    id="gallery-photo-picker"
                    multiple
                    className="hidden"
                    onBatchAccepted={appendAcceptedFiles}
                />
            </div>

            {files.length > 0 ? (
                <div className="flex max-h-60 flex-col gap-2 overflow-y-auto">
                    {files.map(({file, status, progress}, i) => (
                        <div key={`${file.name}-${i}`} className="flex items-center gap-3">
                            <span className="flex-1 truncate text-small text-text-secondary">
                                {file.name}
                            </span>
                            {status === 'uploading' ? (
                                <div className="h-1.5 w-24 overflow-hidden rounded-pill bg-border">
                                    <div
                                        className="h-full bg-primary transition-all duration-fast"
                                        style={{width: `${progress}%`}}
                                    />
                                </div>
                            ) : null}
                            {status === 'done' ? (
                                <span className="text-small text-green-500" aria-hidden>
                                    ✓
                                </span>
                            ) : null}
                            {status === 'error' ? (
                                <span className="text-small text-red-400" aria-hidden>
                                    ✗
                                </span>
                            ) : null}
                        </div>
                    ))}
                </div>
            ) : null}

            {files.length > 0 ? (
                <Button
                    type="button"
                    onClick={handleUpload}
                    disabled={!canStartUpload}
                    className="w-full"
                >
                    {t('upload')} ({files.filter((f) => f.status === 'pending').length})
                </Button>
            ) : null}
        </div>
    )
}
