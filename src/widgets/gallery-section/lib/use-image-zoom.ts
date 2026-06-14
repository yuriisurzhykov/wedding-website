'use client'

import {type RefObject, useCallback, useEffect, useRef, useState} from 'react'

/** Maximum magnification reachable by pinch / wheel / double-tap. */
const MAX_SCALE = 4
/** Scale applied by a double-tap (or the zoom toggle button) from the rest state. */
const DOUBLE_TAP_SCALE = 2.5
/** Two taps closer than this (ms) with little movement count as a double-tap. */
const DOUBLE_TAP_WINDOW_MS = 300
/** Movement (px) below which a pointer gesture is treated as a tap, not a drag. */
const TAP_MOVE_TOLERANCE_PX = 10
/** Horizontal travel (px) before a rest-state drag counts as prev/next. */
const SWIPE_THRESHOLD_PX = 50
/** Below this scale the viewer snaps back to the rest (1×) state. */
const SETTLE_EPSILON = 1.02

type Point = { x: number; y: number }

type SwipeIntent = 'prev' | 'next'

type UseImageZoomOptions = {
    /** Element whose box defines the gesture surface and clamp bounds. */
    containerRef: RefObject<HTMLDivElement | null>
    /** Element the zoom/pan transform is written to (imperatively, no re-render). */
    contentRef: RefObject<HTMLDivElement | null>
    /** When false, rest-state horizontal drags do not emit a swipe. */
    canSwipe: boolean
    /** Called for a rest-state horizontal swipe past the threshold. */
    onSwipe: (intent: SwipeIntent) => void
    /** Changing this value resets zoom/pan (e.g. on slide change). */
    resetKey: string
}

type UseImageZoomResult = {
    /** True while magnified; callers disable swipe affordances and adjust cursor. */
    isZoomed: boolean
    /** Pointer handlers for the gesture surface. */
    pointerHandlers: {
        onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void
        onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void
        onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => void
        onPointerCancel: (e: React.PointerEvent<HTMLDivElement>) => void
    }
    /** Toggle 1× ↔ magnified around the surface centre (keyboard / button). */
    toggleZoom: () => void
    /** Reset to the rest (1×, centred) state. */
    reset: () => void
    /** True when the last gesture moved enough that a trailing click must be ignored. */
    didMoveRef: RefObject<boolean>
}

function clampScale(scale: number): number {
    return Math.min(MAX_SCALE, Math.max(1, scale))
}

/**
 * Keeps the scaled content covering the surface so pan never reveals an edge.
 * With `transform-origin: 0 0`, the displayed top-left is `(tx, ty)`; the scaled
 * box spans `W*scale × H*scale`, so each axis is clamped to `[dim*(1-scale), 0]`.
 */
function clampTranslate(
    tx: number,
    ty: number,
    scale: number,
    width: number,
    height: number,
): Point {
    const minX = width * (1 - scale)
    const minY = height * (1 - scale)
    return {
        x: Math.min(0, Math.max(minX, tx)),
        y: Math.min(0, Math.max(minY, ty)),
    }
}

function distanceBetween(a: Point, b: Point): number {
    const dx = a.x - b.x
    const dy = a.y - b.y
    return Math.hypot(dx, dy)
}

function midpointOf(a: Point, b: Point): Point {
    return {x: (a.x + b.x) / 2, y: (a.y + b.y) / 2}
}

/**
 * Pinch / wheel / double-tap zoom with panning for a full-bleed image surface.
 *
 * The transform is written imperatively to `contentRef` (no per-move re-render);
 * only the coarse `isZoomed` flag is React state. At rest (1×) a horizontal drag
 * is delegated to `onSwipe`; while magnified the same drag pans the image.
 *
 * Coordinates use the surface's local space with `transform-origin: 0 0`, so a
 * focal zoom keeps the point under the cursor/fingers fixed:
 * `t₁ = f − (f − t₀)·(s₁/s₀)`.
 */
export function useImageZoom(
    {containerRef, contentRef, canSwipe, onSwipe, resetKey}: UseImageZoomOptions,
): UseImageZoomResult {
    const [isZoomed, setIsZoomed] = useState(false)

    const scaleRef = useRef(1)
    const txRef = useRef(0)
    const tyRef = useRef(0)

    /** Active pointers by id (surface-local coords). */
    const pointersRef = useRef(new Map<number, Point>())
    /** Pinch snapshot taken when the second pointer goes down. */
    const pinchRef = useRef<{
        startDistance: number
        startMidpoint: Point
        startScale: number
        startTranslate: Point
    } | null>(null)
    /** Single-pointer baseline for pan / swipe / tap detection. */
    const dragRef = useRef<{
        pointerId: number
        startX: number
        startY: number
        lastX: number
        lastY: number
        moved: boolean
    } | null>(null)
    const lastTapRef = useRef<{ time: number; x: number; y: number } | null>(null)
    const didMoveRef = useRef(false)
    const rafRef = useRef<number | null>(null)

    const surfaceSize = useCallback((): { width: number; height: number } => {
        const el = containerRef.current
        if (!el) {
            return {width: 0, height: 0}
        }
        const rect = el.getBoundingClientRect()
        return {width: rect.width, height: rect.height}
    }, [containerRef])

    const localPoint = useCallback(
        (clientX: number, clientY: number): Point => {
            const el = containerRef.current
            if (!el) {
                return {x: clientX, y: clientY}
            }
            const rect = el.getBoundingClientRect()
            return {x: clientX - rect.left, y: clientY - rect.top}
        },
        [containerRef],
    )

    const writeTransform = useCallback(() => {
        const el = contentRef.current
        if (!el) {
            return
        }
        el.style.transform = `translate3d(${txRef.current}px, ${tyRef.current}px, 0) scale(${scaleRef.current})`
    }, [contentRef])

    const scheduleTransform = useCallback(() => {
        if (rafRef.current !== null) {
            return
        }
        rafRef.current = requestAnimationFrame(() => {
            rafRef.current = null
            writeTransform()
        })
    }, [writeTransform])

    const syncZoomedFlag = useCallback(() => {
        const next = scaleRef.current > SETTLE_EPSILON
        setIsZoomed((cur) => (cur === next ? cur : next))
    }, [])

    const applyState = useCallback(
        (scale: number, tx: number, ty: number, immediate: boolean) => {
            const {width, height} = surfaceSize()
            const nextScale = clampScale(scale)
            const clamped = clampTranslate(tx, ty, nextScale, width, height)
            scaleRef.current = nextScale
            txRef.current = nextScale <= 1 ? 0 : clamped.x
            tyRef.current = nextScale <= 1 ? 0 : clamped.y
            if (immediate) {
                writeTransform()
            } else {
                scheduleTransform()
            }
            syncZoomedFlag()
        },
        [surfaceSize, writeTransform, scheduleTransform, syncZoomedFlag],
    )

    const reset = useCallback(() => {
        applyState(1, 0, 0, true)
    }, [applyState])

    /** Focal zoom keeping the point under `focus` fixed. */
    const zoomTo = useCallback(
        (targetScale: number, focus: Point) => {
            const s0 = scaleRef.current
            const s1 = clampScale(targetScale)
            const ratio = s1 / s0
            const tx = focus.x - (focus.x - txRef.current) * ratio
            const ty = focus.y - (focus.y - tyRef.current) * ratio
            applyState(s1, tx, ty, true)
        },
        [applyState],
    )

    const toggleAt = useCallback(
        (focus: Point) => {
            if (scaleRef.current > SETTLE_EPSILON) {
                reset()
            } else {
                zoomTo(DOUBLE_TAP_SCALE, focus)
            }
        },
        [reset, zoomTo],
    )

    const toggleZoom = useCallback(() => {
        const {width, height} = surfaceSize()
        toggleAt({x: width / 2, y: height / 2})
    }, [surfaceSize, toggleAt])

    // Reset whenever the slide changes (or the surface unmounts/remounts).
    useEffect(() => {
        reset()
    }, [resetKey, reset])

    useEffect(() => {
        return () => {
            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current)
            }
        }
    }, [])

    // Wheel must be a non-passive native listener to call preventDefault.
    useEffect(() => {
        const el = containerRef.current
        if (!el) {
            return
        }
        const onWheel = (e: WheelEvent) => {
            e.preventDefault()
            const factor = Math.exp(-e.deltaY * 0.0015)
            zoomTo(scaleRef.current * factor, localPoint(e.clientX, e.clientY))
        }
        el.addEventListener('wheel', onWheel, {passive: false})
        return () => el.removeEventListener('wheel', onWheel)
    }, [containerRef, localPoint, zoomTo])

    const onPointerDown = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            if (e.button !== 0 && e.pointerType === 'mouse') {
                return
            }
            const p = localPoint(e.clientX, e.clientY)
            pointersRef.current.set(e.pointerId, p)
            try {
                e.currentTarget.setPointerCapture(e.pointerId)
            } catch {
                /* capture unsupported — gestures still track via the map */
            }
            didMoveRef.current = false

            if (pointersRef.current.size === 2) {
                const [a, b] = [...pointersRef.current.values()]
                pinchRef.current = {
                    startDistance: distanceBetween(a, b),
                    startMidpoint: midpointOf(a, b),
                    startScale: scaleRef.current,
                    startTranslate: {x: txRef.current, y: tyRef.current},
                }
                dragRef.current = null
            } else if (pointersRef.current.size === 1) {
                dragRef.current = {
                    pointerId: e.pointerId,
                    startX: p.x,
                    startY: p.y,
                    lastX: p.x,
                    lastY: p.y,
                    moved: false,
                }
            }
        },
        [localPoint],
    )

    const onPointerMove = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            if (!pointersRef.current.has(e.pointerId)) {
                return
            }
            const p = localPoint(e.clientX, e.clientY)
            pointersRef.current.set(e.pointerId, p)

            const pinch = pinchRef.current
            if (pinch && pointersRef.current.size >= 2) {
                const [a, b] = [...pointersRef.current.values()]
                const dist = distanceBetween(a, b)
                const mid = midpointOf(a, b)
                const s1 = clampScale(
                    pinch.startScale * (dist / (pinch.startDistance || 1)),
                )
                const layerMidX =
                    (pinch.startMidpoint.x - pinch.startTranslate.x) /
                    pinch.startScale
                const layerMidY =
                    (pinch.startMidpoint.y - pinch.startTranslate.y) /
                    pinch.startScale
                applyState(s1, mid.x - layerMidX * s1, mid.y - layerMidY * s1, false)
                didMoveRef.current = true
                return
            }

            const drag = dragRef.current
            if (!drag || drag.pointerId !== e.pointerId) {
                return
            }
            const dx = p.x - drag.lastX
            const dy = p.y - drag.lastY
            drag.lastX = p.x
            drag.lastY = p.y
            if (
                Math.abs(p.x - drag.startX) > TAP_MOVE_TOLERANCE_PX ||
                Math.abs(p.y - drag.startY) > TAP_MOVE_TOLERANCE_PX
            ) {
                drag.moved = true
                didMoveRef.current = true
            }
            if (scaleRef.current > SETTLE_EPSILON) {
                applyState(
                    scaleRef.current,
                    txRef.current + dx,
                    tyRef.current + dy,
                    false,
                )
            }
        },
        [applyState, localPoint],
    )

    const endPinchSettle = useCallback(() => {
        if (scaleRef.current <= SETTLE_EPSILON) {
            applyState(1, 0, 0, true)
        } else {
            applyState(scaleRef.current, txRef.current, tyRef.current, true)
        }
    }, [applyState])

    const finishSinglePointer = useCallback(
        (drag: NonNullable<typeof dragRef.current>, end: Point) => {
            const dx = end.x - drag.startX
            const dy = end.y - drag.startY
            const moved =
                Math.abs(dx) > TAP_MOVE_TOLERANCE_PX ||
                Math.abs(dy) > TAP_MOVE_TOLERANCE_PX

            if (!moved) {
                const now = Date.now()
                const last = lastTapRef.current
                if (
                    last &&
                    now - last.time < DOUBLE_TAP_WINDOW_MS &&
                    Math.abs(end.x - last.x) < TAP_MOVE_TOLERANCE_PX * 2 &&
                    Math.abs(end.y - last.y) < TAP_MOVE_TOLERANCE_PX * 2
                ) {
                    lastTapRef.current = null
                    toggleAt(end)
                } else {
                    lastTapRef.current = {time: now, x: end.x, y: end.y}
                }
                return
            }

            // Rest-state horizontal swipe → navigation.
            if (
                scaleRef.current <= SETTLE_EPSILON &&
                canSwipe &&
                Math.abs(dx) >= SWIPE_THRESHOLD_PX &&
                Math.abs(dx) > Math.abs(dy)
            ) {
                onSwipe(dx < 0 ? 'next' : 'prev')
            }
        },
        [canSwipe, onSwipe, toggleAt],
    )

    const releasePointer = useCallback(
        (e: React.PointerEvent<HTMLDivElement>, cancelled: boolean) => {
            const tracked = pointersRef.current.get(e.pointerId)
            pointersRef.current.delete(e.pointerId)
            try {
                e.currentTarget.releasePointerCapture(e.pointerId)
            } catch {
                /* already released */
            }

            const wasPinch = pinchRef.current !== null
            if (wasPinch && pointersRef.current.size < 2) {
                pinchRef.current = null
                endPinchSettle()
                // Re-baseline pan against the finger that is still down.
                const [remainingId] = [...pointersRef.current.keys()]
                if (remainingId !== undefined) {
                    const rp = pointersRef.current.get(remainingId)!
                    dragRef.current = {
                        pointerId: remainingId,
                        startX: rp.x,
                        startY: rp.y,
                        lastX: rp.x,
                        lastY: rp.y,
                        moved: false,
                    }
                }
                return
            }

            const drag = dragRef.current
            if (drag && drag.pointerId === e.pointerId) {
                dragRef.current = null
                if (!cancelled && tracked) {
                    finishSinglePointer(drag, tracked)
                }
            }
        },
        [endPinchSettle, finishSinglePointer],
    )

    const onPointerUp = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => releasePointer(e, false),
        [releasePointer],
    )
    const onPointerCancel = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => releasePointer(e, true),
        [releasePointer],
    )

    return {
        isZoomed,
        pointerHandlers: {onPointerDown, onPointerMove, onPointerUp, onPointerCancel},
        toggleZoom,
        reset,
        didMoveRef,
    }
}
