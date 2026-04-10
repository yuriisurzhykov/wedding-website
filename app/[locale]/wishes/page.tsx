import type {Metadata} from 'next'
import {getTranslations} from 'next-intl/server'

import {FeatureGate} from '@features/site-settings/client'
import {getSiteSettingsCached} from '@features/site-settings'
import {WishesSection} from '@widgets/wishes-section'

export async function generateMetadata(): Promise<Metadata> {
    const tNav = await getTranslations('nav')
    const tWishes = await getTranslations('wishes')
    return {
        title: tNav('wishes'),
        description: tWishes('subtitle'),
    }
}

export default async function WishesPage() {
    const siteSettings = await getSiteSettingsCached()
    if (!siteSettings.capabilities.wishSubmit) {
        return null
    }
    return (
        <FeatureGate capability="wishSubmit">
            <WishesSection presentation="full"/>
        </FeatureGate>
    )
}
