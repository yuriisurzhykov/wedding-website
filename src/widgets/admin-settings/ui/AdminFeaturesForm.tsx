'use client'

import {useRouter} from '@/i18n/navigation'
import {
    FEATURE_STATE_VALUES,
    type FeatureState,
    SITE_FEATURE_KEYS,
    type SiteCapabilities,
    type SiteSettings,
} from '@entities/site-settings'
import {Button} from '@shared/ui/Button'
import {Select} from '@shared/ui/Select'
import {useTranslations} from 'next-intl'
import {useEffect, useRef, useState} from 'react'
import {toast} from 'sonner'

import {patchAdminSiteSettings} from '../lib/patch-admin-site-settings'

import {AdminPublicContactForm} from './AdminPublicContactForm'

function cloneCapabilities(settings: SiteSettings): SiteCapabilities {
    return {...settings.capabilities}
}

type Props = Readonly<{
    initialSettings: SiteSettings
}>

export function AdminFeaturesForm({initialSettings}: Props) {
    const tPage = useTranslations('admin.featuresPage')
    const tSettings = useTranslations('admin.settings')

    const router = useRouter()

    const [capabilities, setCapabilities] = useState(() => cloneCapabilities(initialSettings))
    const [saving, setSaving] = useState(false)
    const [updatedAt, setUpdatedAt] = useState(initialSettings.updated_at)

    const lastSyncedServerAt = useRef(initialSettings.updated_at)
    useEffect(() => {
        if (initialSettings.updated_at === lastSyncedServerAt.current) {
            return
        }
        lastSyncedServerAt.current = initialSettings.updated_at
        setUpdatedAt(initialSettings.updated_at)
        setCapabilities(cloneCapabilities(initialSettings))
    }, [initialSettings])

    function setCapability(key: (typeof SITE_FEATURE_KEYS)[number], value: FeatureState) {
        setCapabilities((prev) => ({...prev, [key]: value}))
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (saving) {
            return
        }

        setSaving(true)
        try {
            const result = await patchAdminSiteSettings({capabilities})

            if (!result.ok && result.status === 401) {
                toast.error(tSettings('errors.notSignedIn'))
                return
            }

            if (!result.ok && result.status === 429) {
                const data = result.data
                const retry =
                    typeof data === 'object' &&
                    data !== null &&
                    'retry_after' in data &&
                    typeof (data as {retry_after: unknown}).retry_after === 'number'
                        ? (data as {retry_after: number}).retry_after
                        : undefined
                toast.error(
                    retry !== undefined
                        ? tSettings('errors.rateLimited', {seconds: retry})
                        : tSettings('errors.rateLimitedGeneric'),
                )
                return
            }

            if (!result.ok) {
                const data = result.data
                const msg =
                    typeof data === 'object' &&
                    data !== null &&
                    'error' in data &&
                    typeof (data as {error: unknown}).error === 'string'
                        ? (data as {error: string}).error
                        : tSettings('errors.saveFailed')
                toast.error(msg)
                return
            }

            if (result.updated_at) {
                setUpdatedAt(result.updated_at)
            }

            toast.success(tPage('toast.saved'))
            router.refresh()
        } catch {
            toast.error(tSettings('errors.saveFailed'))
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="mx-auto max-w-3xl px-4 py-10">
            <header className="mb-8">
                <h1 className="font-display text-h2 text-text-primary">{tPage('title')}</h1>
                <p className="mt-2 text-body text-text-secondary">{tPage('subtitle')}</p>
                <p className="mt-3 text-small text-text-secondary">{tPage('accessHint')}</p>
                <p className="mt-1 font-mono text-small text-text-secondary">
                    {tSettings('updatedAtLabel')}: {updatedAt}
                </p>
            </header>

            <AdminPublicContactForm initialSettings={initialSettings} />

            <form onSubmit={handleSubmit} className="flex flex-col gap-10">
                <section className="rounded-card border border-border bg-bg-card p-6 shadow-sm">
                    <h2 className="font-display text-h3 text-text-primary">
                        {tSettings('capabilities.title')}
                    </h2>
                    <ul className="mt-4 flex flex-col gap-4">
                        {SITE_FEATURE_KEYS.map((key) => (
                            <li
                                key={key}
                                className="flex flex-col gap-2 border-b border-border/60 pb-4 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                            >
                                <span className="text-body text-text-primary">
                                    {tSettings(`capabilities.labels.${key}`)}
                                </span>
                                <div className="inline-flex flex-col gap-1 sm:items-end">
                                    <label
                                        className="text-small text-text-secondary"
                                        htmlFor={`admin-feature-state-${key}`}
                                    >
                                        {tSettings('capabilities.state')}
                                    </label>
                                    <Select
                                        id={`admin-feature-state-${key}`}
                                        className="min-w-[12rem] rounded-pill"
                                        value={capabilities[key]}
                                        onChange={(ev) =>
                                            setCapability(key, ev.target.value as FeatureState)
                                        }
                                    >
                                        {FEATURE_STATE_VALUES.map((state) => (
                                            <option key={state} value={state}>
                                                {tSettings(`capabilities.stateLabels.${state}`)}
                                            </option>
                                        ))}
                                    </Select>
                                </div>
                            </li>
                        ))}
                    </ul>
                </section>

                <div className="flex justify-end">
                    <Button type="submit" disabled={saving}>
                        {saving ? tPage('saving') : tPage('save')}
                    </Button>
                </div>
            </form>
        </div>
    )
}
