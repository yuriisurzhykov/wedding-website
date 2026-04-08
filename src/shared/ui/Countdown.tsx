'use client'

import {useEffect, useState, useSyncExternalStore} from 'react'
import {useTranslations} from 'next-intl'

interface TimeLeft {
    days: number
    hours: number
    minutes: number
    seconds: number
}

const ZERO: TimeLeft = {days: 0, hours: 0, minutes: 0, seconds: 0}

const noopSubscribe = () => () => {}

function useIsClient() {
    return useSyncExternalStore(noopSubscribe, () => true, () => false)
}

function calcTimeLeft(target: Date): TimeLeft {
    const diff = target.getTime() - Date.now()
    if (diff <= 0) return {...ZERO}
    return {
        days: Math.floor(diff / 86_400_000),
        hours: Math.floor((diff % 86_400_000) / 3_600_000),
        minutes: Math.floor((diff % 3_600_000) / 60_000),
        seconds: Math.floor((diff % 60_000) / 1_000),
    }
}

export function Countdown({targetDate}: {targetDate: Date}) {
    const t = useTranslations('hero.countdown')
    const mounted = useIsClient()
    const [time, setTime] = useState<TimeLeft>(ZERO)
    const [passed, setPassed] = useState(false)

    useEffect(() => {
        if (!mounted) return
        const tick = (): boolean => {
            const p = targetDate.getTime() <= Date.now()
            setPassed(p)
            setTime(calcTimeLeft(targetDate))
            return p
        }
        if (tick()) return
        const id = setInterval(() => {
            if (tick()) clearInterval(id)
        }, 1_000)
        return () => clearInterval(id)
    }, [targetDate, mounted])

    if (mounted && passed) {
        return <p className="text-text-secondary">{t('passed')}</p>
    }

    const display = mounted ? time : ZERO

    const segments = [
        {key: 'days' as const, value: display.days, label: t('days')},
        {key: 'hours' as const, value: display.hours, label: t('hours')},
        {key: 'minutes' as const, value: display.minutes, label: t('minutes')},
        {key: 'seconds' as const, value: display.seconds, label: t('seconds')},
    ]

    return (
        <div
            className="grid grid-cols-4 gap-6"
            aria-busy={!mounted}
            aria-live={mounted ? 'polite' : undefined}
        >
            {segments.map(({key, value, label}) => (
                <div key={key} className="flex flex-col items-center gap-1">
                    <span className="font-display text-hero text-text-primary tabular-nums">
                        {String(value).padStart(2, '0')}
                    </span>
                    <span className="text-xs uppercase tracking-widest text-text-muted">{label}</span>
                </div>
            ))}
        </div>
    )
}
