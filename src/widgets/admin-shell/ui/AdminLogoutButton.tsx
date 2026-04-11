'use client'

import {useRouter} from '@/i18n/navigation'
import {Button} from '@shared/ui/Button'
import {useLocale} from 'next-intl'
import {useTranslations} from 'next-intl'
import {useState} from 'react'

export function AdminLogoutButton() {
    const t = useTranslations('admin.shell')
    const router = useRouter()
    const locale = useLocale()
    const [pending, setPending] = useState(false)

    async function onLogout() {
        if (pending) {
            return
        }
        setPending(true)
        try {
            const res = await fetch('/api/admin/logout', {
                method: 'POST',
                credentials: 'include',
            })
            if (!res.ok) {
                return
            }
            const loginPath = locale === 'ru' ? '/ru/admin/login' : '/admin/login'
            router.push(loginPath)
            router.refresh()
        } finally {
            setPending(false)
        }
    }

    return (
        <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => void onLogout()}
        >
            {pending ? t('loggingOut') : t('logout')}
        </Button>
    )
}
