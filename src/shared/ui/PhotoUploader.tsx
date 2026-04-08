'use client'

import React, {useCallback, useRef, useState} from 'react'
import {useTranslations} from 'next-intl'
import {toast} from 'sonner'

import {cn} from '@shared/lib/cn'
import {GALLERY_USE_SERVER_MULTIPART_UPLOAD} from '@shared/lib/gallery-upload-mode'
import {postMultipartGalleryPhoto} from '@shared/lib/gallery-client-upload'

import {Button} from './Button'
import {Input} from './Input'

const MAX_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/heic',
] as const
const MAX_PARALLEL = 3

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
) => Promise<void>

/**
 * Direct browser→R2 (presign → PUT → confirm). Requires CORS on the R2 bucket (`docs/r2-cors.md`).
 */
export async function presignedPhotoUploadAdapter(
    file: File,
    uploaderName: string,
    onProgress: (p: number) => void,
): Promise<void> {
    const presignRes = await fetch('/api/upload/presign', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({contentType: file.type, size: file.size}),
    })
    if (!presignRes.ok) throw new Error('Presign failed')
    const {url, key} = (await presignRes.json()) as {url: string; key: string}
    onProgress(30)

    const uploadRes = await fetch(url, {
        method: 'PUT',
        headers: {'Content-Type': file.type},
        body: file,
    })
    if (!uploadRes.ok) throw new Error('Upload failed')
    onProgress(80)

    const confirmRes = await fetch('/api/upload/confirm', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({key, uploaderName, sizeBytes: file.size}),
    })
    if (!confirmRes.ok) throw new Error('Confirm failed')
    onProgress(100)
}

/** Same-origin upload through Next.js (no R2 CORS). Enable with `NEXT_PUBLIC_GALLERY_SERVER_UPLOAD=true`. */
export async function serverPhotoUploadAdapter(
    file: File,
    uploaderName: string,
    onProgress: (p: number) => void,
): Promise<void> {
    await postMultipartGalleryPhoto(file, uploaderName, onProgress)
}

/** Default: presigned R2; server multipart if `NEXT_PUBLIC_GALLERY_SERVER_UPLOAD=true`. */
export const defaultPhotoUploadAdapter: PhotoUploadAdapter =
    GALLERY_USE_SERVER_MULTIPART_UPLOAD
        ? serverPhotoUploadAdapter
        : presignedPhotoUploadAdapter

/** Simulated progress for demos / component book when API is unavailable. */
export async function mockPhotoUploadAdapter(
    _file: File,
    _uploaderName: string,
    onProgress: (p: number) => void,
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
}: {
    uploadAdapter?: PhotoUploadAdapter
    /** Called after at least one file uploaded successfully (e.g. refetch gallery list). */
    onUploadSuccess?: () => void | Promise<void>
}) {
    const t = useTranslations('gallery')
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [files, setFiles] = useState<UploadFile[]>([])
    const [name, setName] = useState('')
    const [isDragging, setDragging] = useState(false)

    const addFiles = useCallback((newFiles: File[]) => {
        const valid = newFiles.filter(
            (f) =>
                (ALLOWED_TYPES as readonly string[]).includes(f.type) &&
                f.size <= MAX_SIZE,
        )
        setFiles((prev) => [
            ...prev,
            ...valid.map((f) => ({
                file: f,
                status: 'pending' as FileStatus,
                progress: 0,
            })),
        ])
    }, [])

    function handleDrop(e: React.DragEvent) {
        e.preventDefault()
        setDragging(false)
        addFiles(Array.from(e.dataTransfer.files))
    }

    function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
        addFiles(Array.from(e.target.files ?? []))
    }

    function updateFile(index: number, updates: Partial<UploadFile>) {
        setFiles((prev) => prev.map((f, i) => (i === index ? {...f, ...updates} : f)))
    }

    async function handleUpload() {
        if (!name.trim() || files.length === 0) return

        const pending = files
            .map((f, i) => ({...f, index: i}))
            .filter((f) => f.status === 'pending')

        let successCount = 0

        for (let i = 0; i < pending.length; i += MAX_PARALLEL) {
            const batch = pending.slice(i, i + MAX_PARALLEL)
            await Promise.all(
                batch.map(({file, index}) => {
                    updateFile(index, {status: 'uploading'})
                    return uploadAdapter(file, name, (p) => updateFile(index, {progress: p}))
                        .then(() => {
                            updateFile(index, {status: 'done', progress: 100})
                            successCount += 1
                        })
                        .catch(() => updateFile(index, {status: 'error'}))
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

    return (
        <div className="flex flex-col gap-5">
            <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('uploaderName')}
            />

            <div
                role="button"
                tabIndex={0}
                onDrop={handleDrop}
                onDragOver={(e) => {
                    e.preventDefault()
                    setDragging(true)
                }}
                onDragLeave={() => setDragging(false)}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        fileInputRef.current?.click()
                    }
                }}
                aria-label={t('dropzone')}
                className={cn(
                    'cursor-pointer rounded-lg border-2 border-dashed p-10 text-center',
                    'transition-colors duration-fast',
                    isDragging
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50 hover:bg-bg-section',
                )}
            >
                <p className="mb-1 text-text-secondary">{t('dropzone')}</p>
                <p className="text-small text-text-muted">{t('maxSize')}</p>
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept={ALLOWED_TYPES.join(',')}
                    className="hidden"
                    onChange={handleInput}
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
                    disabled={!name.trim()}
                    className="w-full"
                >
                    {t('upload')} ({files.filter((f) => f.status === 'pending').length})
                </Button>
            ) : null}
        </div>
    )
}
