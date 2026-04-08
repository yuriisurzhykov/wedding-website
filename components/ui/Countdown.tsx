'use client'

import {useEffect, useState} from 'react'
import {useTranslations} from 'next-intl'

interface TimeLeft {
    days: number
    hours: number
    minutes: number
    seconds: number
}

function calcTimeLeft(target: Date): TimeLeft {
    const diff = target.getTime() - Date.now()
    if (diff <= 0) return {days: 0, hours: 0, minutes: 0, seconds: 0}
    return {
        days: Math.floor(diff / 86_400_000),
        hours: Math.floor((diff % 86_400_000) / 3_600_000),
        minutes: Math.floor((diff % 3_600_000) / 60_000),
        seconds: Math.floor((diff % 60_000) / 1_000),
    }
}

export function Countdown({targetDate}: { targetDate: Date }) {
    const t = useTranslations('hero.countdown')
    const [time, setTime] = useState<TimeLeft>(() => calcTimeLeft(targetDate))
    const passed = targetDate.getTime() <= Date.now()

    useEffect(() => {
        if (passed) return
        const id = setInterval(() => setTime(calcTimeLeft(targetDate)), 1_000)
        return () => clearInterval(id)
    }, [targetDate, passed])

    if (passed) {
        return <p className="text-text-secondary">{t('passed')}</p>
    }

    const segments = [
        {key: 'days' as const, value: time.days, label: t('days')},
        {key: 'hours' as const, value: time.hours, label: t('hours')},
        {key: 'minutes' as const, value: time.minutes, label: t('minutes')},
        {key: 'seconds' as const, value: time.seconds, label: t('seconds')},
    ]

    return (
        <div className="grid grid-cols-4 gap-6">
            {segments.map(({key, value, label}) => (
                <div key={key} className="flex flex-col items-center gap-1">
                    <span className="font-display text-hero text-text-primary tabular-nums">
                        {String(value).padStart(2, '0')}
                    </span>
                    <span className="text-xs uppercase tracking-widest text-text-muted">
                        {label}
                    </span>
                </div>
            ))}
        </div>
    )
}
