'use client'

import Image from 'next/image'
import {type Ref, useCallback, useImperativeHandle, useRef} from 'react'

import {cn} from '@shared/lib/cn'

import {useImageZoom} from '../lib/use-image-zoom'

/** Direction a new slide enters from: -1 prev, 0 none, 1 next. */
export type SlideDirection = -1 | 0 | 1

/** Imperative surface so the lightbox chrome can drive the zoom toggle. */
export type GalleryZoomablePhotoHandle = {
    toggleZoom: () => void
}

/** Slide-in offset when changing slides (disabled via `motion-reduce:`). */
const LIGHTBOX_SLIDE_OFFSET_CLASS = 'motion-safe:translate-x-10'

function slideOffsetClassForDirection(dir: SlideDirection): string {
    if (dir === 0) {
        return 'translate-x-0'
    }
    if (dir === 1) {
        return LIGHTBOX_SLIDE_OFFSET_CLASS
    }
    return 'motion-safe:-translate-x-10'
}

/**
 * Viewport rectangle of the painted bitmap for `object-fit: contain` inside a box
 * with natural size `nw`×`nh`.
 */
function getObjectContainPaintedRectViewport(
    containerViewport: DOMRectReadOnly,
    nw: number,
    nh: number,
): { left: number; top: number; right: number; bottom: number } {
    if (nw <= 0 || nh <= 0) {
        const {left, top, right, bottom} = containerViewport
        return {left, top, right, bottom}
    }
    const W = containerViewport.width
    const H = containerViewport.height
    const scale = Math.min(W / nw, H / nh)
    const dispW = nw * scale
    const dispH = nh * scale
    const left = containerViewport.left + (W - dispW) / 2
    const top = containerViewport.top + (H - dispH) / 2
    return {
        left,
        top,
        right: left + dispW,
        bottom: top + dispH,
    }
}

function isPointInsideRect(
    x: number,
    y: number,
    r: { left: number; top: number; right: number; bottom: number },
): boolean {
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom
}

type GalleryZoomablePhotoProps = {
    src: string
    alt: string
    /** Identity of the current slide; remounts the layer and resets zoom on change. */
    slideKey: string
    /** Enter direction for the slide transition. */
    dir: SlideDirection
    /** True once the bitmap has loaded; gates the enter transition and skeleton. */
    slideReady: boolean
    /** Enables horizontal swipe navigation (rest state only). */
    multi: boolean
    onPrev: () => void
    onNext: () => void
    /** Called when the bitmap finishes loading (or errors), to reveal the slide. */
    onReveal: (epoch: string) => void
    loadingLabel: string
    ref?: Ref<GalleryZoomablePhotoHandle>
}

/**
 * Photo surface with pinch / wheel / double-tap zoom and panning.
 *
 * Owns the gesture surface, the per-slide enter transition, the loading skeleton,
 * and the close-on-tap-outside-bitmap decision: at rest a tap on the painted image
 * keeps the lightbox open (stops propagation) while a tap on the letterbox bubbles
 * to the backdrop to close. While magnified or right after a drag, taps never close.
 */
export function GalleryZoomablePhoto(
    {
        src,
        alt,
        slideKey,
        dir,
        slideReady,
        multi,
        onPrev,
        onNext,
        onReveal,
        loadingLabel,
        ref,
    }: GalleryZoomablePhotoProps,
) {
    const containerRef = useRef<HTMLDivElement>(null)
    const contentRef = useRef<HTMLDivElement>(null)
    const imgRef = useRef<HTMLImageElement | null>(null)

    const onSwipe = useCallback(
        (intent: 'prev' | 'next') => {
            if (intent === 'next') {
                onNext()
            } else {
                onPrev()
            }
        },
        [onNext, onPrev],
    )

    const {isZoomed, pointerHandlers, toggleZoom, didMoveRef} = useImageZoom({
        containerRef,
        contentRef,
        canSwipe: multi,
        onSwipe,
        resetKey: slideKey,
    })

    useImperativeHandle(ref, () => ({toggleZoom}), [toggleZoom])

    const handleClick = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            if (didMoveRef.current) {
                e.stopPropagation()
                return
            }
            if (isZoomed) {
                e.stopPropagation()
                return
            }
            const container = containerRef.current
            const img = imgRef.current
            if (!container || !img?.naturalWidth || !img.naturalHeight) {
                return
            }
            const painted = getObjectContainPaintedRectViewport(
                container.getBoundingClientRect(),
                img.naturalWidth,
                img.naturalHeight,
            )
            if (isPointInsideRect(e.clientX, e.clientY, painted)) {
                e.stopPropagation()
            }
        },
        [didMoveRef, isZoomed],
    )

    return (
        <div
            ref={containerRef}
            className={cn(
                'pointer-events-auto relative min-h-0 min-w-0 max-w-full flex-1 touch-none select-none overflow-hidden',
                isZoomed ? 'cursor-grab' : 'cursor-zoom-in',
            )}
            onClick={handleClick}
            onPointerDown={pointerHandlers.onPointerDown}
            onPointerMove={pointerHandlers.onPointerMove}
            onPointerUp={pointerHandlers.onPointerUp}
            onPointerCancel={pointerHandlers.onPointerCancel}
            role="status"
            aria-busy={!slideReady}
            aria-label={!slideReady ? loadingLabel : undefined}
        >
            {!slideReady ? (
                <div
                    className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-black/35"
                    aria-hidden
                >
                    <div
                        className={cn(
                            'h-[min(55vw,20rem)] w-[min(88vw,36rem)] max-w-full rounded-lg',
                            'bg-white/10 animate-pulse',
                        )}
                    />
                </div>
            ) : null}
            <div
                key={slideKey}
                className={cn(
                    'absolute inset-0',
                    slideReady
                        ? cn(
                            'opacity-100 translate-x-0',
                            'transition-[opacity,transform] duration-300 ease-out',
                            'motion-reduce:transition-opacity motion-reduce:duration-200',
                        )
                        : cn(
                            'opacity-0 transition-none',
                            slideOffsetClassForDirection(dir),
                            'motion-reduce:translate-x-0',
                        ),
                )}
            >
                <div
                    ref={contentRef}
                    className="absolute inset-0 origin-top-left will-change-transform"
                >
                    <Image
                        ref={imgRef}
                        src={src}
                        alt={alt}
                        fill
                        sizes="100vw"
                        priority
                        quality={80}
                        draggable={false}
                        className="object-contain object-center"
                        onLoadingComplete={() => onReveal(slideKey)}
                        onError={() => onReveal(slideKey)}
                    />
                </div>
            </div>
        </div>
    )
}
