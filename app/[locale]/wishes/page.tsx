import type {Metadata} from 'next'
import {getTranslations} from 'next-intl/server'
import {notFound} from 'next/navigation'

import {getSiteSettingsCached} from '@features/site-settings'
import {SectionFeaturePreview} from '@features/site-settings/client'
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
    const state = siteSettings.capabilities.wishSubmit
    if (state === 'hidden') {
        notFound()
    }
    if (state === 'preview') {
        return (
            <SectionFeaturePreview
                sectionId="wishes"
                theme="alt"
                messageNamespace="wishes"
            />
        )
    }
    return <WishesSection presentation="full"/>
}
