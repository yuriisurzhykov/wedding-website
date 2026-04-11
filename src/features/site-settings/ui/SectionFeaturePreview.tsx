'use client'

import {useTranslations} from 'next-intl'

import {cn} from '@shared/lib/cn'
import {Section, SectionHeader, type SectionTheme} from '@shared/ui'

const PREVIEW_NAMESPACES = ['schedule', 'rsvp', 'gallery', 'wishes', 'story'] as const

export type FeaturePreviewMessageNamespace = (typeof PREVIEW_NAMESPACES)[number]

type Props = Readonly<{
    sectionId: string
    theme: SectionTheme
    messageNamespace: FeaturePreviewMessageNamespace
    className?: string
    contentClassName?: string
}>

/**
 * Standard section shell for a feature in `preview`: same title/subtitle as when enabled, body is {@link previewNotice}
 * in messages.
 */
export function SectionFeaturePreview({
                                          sectionId,
                                          theme,
                                          messageNamespace,
                                          className,
                                          contentClassName,
                                      }: Props) {
    const t = useTranslations(messageNamespace)
    return (
        <Section id={sectionId} theme={theme} className={className}>
            <div
                className={cn(
                    'mx-auto max-w-(--content-width)',
                    contentClassName,
                )}
            >
                <SectionHeader title={t('title')} subtitle={t('subtitle')}/>
                <p
                    className="mx-auto mt-6 max-w-[min(36rem,var(--content-width))] text-center font-display text-body leading-relaxed text-text-secondary"
                >
                    {t('previewNotice')}
                </p>
            </div>
        </Section>
    )
}
