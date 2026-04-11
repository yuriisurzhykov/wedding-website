'use client'

import {useRouter} from '@/i18n/navigation'
import {Button} from '@shared/ui/Button'
import {Input} from '@shared/ui/Input'
import {useLocale} from 'next-intl'
import {useTranslations} from 'next-intl'
import {useState} from 'react'
import {toast} from 'sonner'

export function AdminLoginForm() {
    const t = useTranslations('admin.login')
    const router = useRouter()
    const locale = useLocale()
    const [password, setPassword] = useState('')
    const [pending, setPending] = useState(false)

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (pending || !password.trim()) {
            return
        }
        setPending(true)
        try {
            const res = await fetch('/api/admin/login', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                credentials: 'include',
                body: JSON.stringify({password}),
            })
            const data: unknown = await res.json().catch(() => null)
            const apiError =
                typeof data === 'object' &&
                data !== null &&
                'error' in data &&
                typeof (data as {error: unknown}).error === 'string'
                    ? (data as {error: string}).error
                    : undefined
            if (res.status === 429) {
                const retry =
                    typeof data === 'object' &&
                    data !== null &&
                    'retry_after' in data &&
                    typeof (data as {retry_after: unknown}).retry_after === 'number'
                        ? (data as {retry_after: number}).retry_after
                        : undefined
                toast.error(
                    retry !== undefined
                        ? t('rateLimited', {seconds: retry})
                        : t('rateLimitedGeneric'),
                )
                return
            }
            if (res.ok) {
                const adminHome = locale === 'ru' ? '/ru/admin' : '/admin'
                router.push(adminHome)
                router.refresh()
                return
            }
            if (res.status === 401) {
                toast.error(t('invalidCredentials'))
                return
            }
            if (res.status === 400) {
                toast.error(t('badRequest'))
                return
            }
            if (res.status >= 500) {
                toast.error(apiError ?? t('serverError'))
                return
            }
            toast.error(t('invalidCredentials'))
            return
        } catch {
            toast.error(t('networkError'))
        } finally {
            setPending(false)
        }
    }

    return (
        <form
            onSubmit={(e) => void onSubmit(e)}
            className="mx-auto max-w-md rounded-lg border border-border bg-bg-card p-6 shadow-card"
        >
            <h1 className="font-display text-h2 text-text-primary">{t('title')}</h1>
            <p className="mt-2 text-body text-text-secondary">{t('subtitle')}</p>
            <label className="mt-6 block">
                <span className="mb-1 block text-small font-medium text-text-primary">
                    {t('passwordLabel')}
                </span>
                <Input
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full"
                />
            </label>
            <Button
                type="submit"
                className="mt-6 w-full"
                disabled={pending}
            >
                {pending ? t('submitting') : t('submit')}
            </Button>
        </form>
    )
}
