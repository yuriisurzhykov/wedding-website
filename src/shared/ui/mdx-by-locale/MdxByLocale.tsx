'use client'

import type {ComponentType} from 'react'

import StoryEn from '@/content/story/en.mdx'
import StoryRu from '@/content/story/ru.mdx'
import WelcomeEn from '@/content/welcome/en.mdx'
import WelcomeRu from '@/content/welcome/ru.mdx'

const welcomeByLocale: Record<string, ComponentType> = {
    en: WelcomeEn,
    ru: WelcomeRu,
}

const storyByLocale: Record<string, ComponentType> = {
    en: StoryEn,
    ru: StoryRu,
}

export function MdxByLocale({
    part,
    locale,
}: {
    part: 'welcome' | 'story'
    locale: string
}) {
    const map = part === 'welcome' ? welcomeByLocale : storyByLocale
    const Content = map[locale] ?? map.ru
    return <Content />
}
