import {GuestSessionProvider} from '@features/guest-session'
import {SiteCapabilitiesProvider} from '@features/site-settings/client'
import {getSiteSettingsCached} from '@features/site-settings'
import {NextIntlClientProvider} from 'next-intl'
import {getMessages, setRequestLocale} from 'next-intl/server'
import {notFound} from 'next/navigation'
import {routing} from '@/i18n/routing'
import {NavigationProgressBar} from '@shared/ui'
import {SiteNavigation} from '@widgets/site-navigation'
import React, {Suspense} from 'react'

type Props = Readonly<{
    children: React.ReactNode
    params: Promise<{ locale: string }>
}>

export function generateStaticParams() {
    return routing.locales.map((locale) => ({locale}))
}

export default async function LocaleLayout({children, params}: Props) {
    const {locale} = await params

    if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
        notFound()
    }

    setRequestLocale(locale)

    const messages = await getMessages()
    const siteSettings = await getSiteSettingsCached()

    return (
        <NextIntlClientProvider locale={locale} messages={messages}>
            <SiteCapabilitiesProvider
                initialCapabilities={siteSettings.capabilities}
                initialUpdatedAt={siteSettings.updated_at}
            >
                <GuestSessionProvider>
                    <Suspense fallback={null}>
                        <NavigationProgressBar/>
                    </Suspense>
                    <SiteNavigation/>
                    <main className="flex flex-col pt-16">{children}</main>
                </GuestSessionProvider>
            </SiteCapabilitiesProvider>
        </NextIntlClientProvider>
    )
}
