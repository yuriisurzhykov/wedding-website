'use client'

import {useCallback, useState} from 'react'
import {useTranslations} from 'next-intl'

import type {PaymentConfig} from '@/src/entities/payments'
import {ZELLE_PHONE_NUMBER} from '@/src/entities/payments'
import {cn} from '@shared/lib/cn'

export function DeepLinkButton({service}: { service: PaymentConfig }) {
    const translator = useTranslations('donate')
    const [feedback, setFeedback] = useState<string | null>(null)

    const clearFeedbackLater = useCallback(() => {
        window.setTimeout(() => setFeedback(null), 5_000)
    }, [])

    async function handleClick() {
        if (!service.deepLink) {
            try {
                await navigator.clipboard.writeText(ZELLE_PHONE_NUMBER)
                setFeedback(translator('zelleCopied'))
            } catch {
                setFeedback(`${translator('zelleCopyFailed')} ${ZELLE_PHONE_NUMBER}`)
            }
            clearFeedbackLater()
            return
        }

        window.location.href = service.deepLink

        window.setTimeout(() => {
            if (!document.hidden && service.fallback) {
                window.open(service.fallback, '_blank', 'noopener,noreferrer')
            }
        }, 2_000)
    }

    return (
        <div className="flex flex-col items-stretch gap-2">
            <button
                type="button"
                onClick={handleClick}
                className={cn(
                    service.color,
                    'flex items-center gap-3 rounded-pill px-7 py-4 text-body font-medium text-white',
                    'shadow-button transition-transform duration-fast hover:opacity-90 active:scale-95',
                )}
            >
                <span className="text-xl" aria-hidden>
                    {service.icon}
                </span>
                <span>{service.label}</span>
            </button>
            {feedback ? (
                <p className="text-center text-small text-text-secondary" role="status">
                    {feedback}
                </p>
            ) : null}
        </div>
    )
}
