import {getTranslations} from 'next-intl/server'

import {CONTACT} from '@entities/wedding-venue'
import {toDialString} from '@shared/lib/phone'
import {Section, SectionHeader, type SectionTheme} from '@shared/ui'

type Props = Readonly<{
    theme?: SectionTheme
}>

const linkClassName =
    'text-body font-medium text-primary underline decoration-primary/50 underline-offset-[0.2em] transition hover:text-primary-dark hover:decoration-primary'

/**
 * Contact section: phone (`tel:`) and email (`mailto:`) from `@entities/wedding-venue` `CONTACT`.
 */
export async function ContactSection({theme = 'alt'}: Props = {}) {
    const t = await getTranslations('contact')
    const dialHref = toDialString(CONTACT.phone)
    const telHref = dialHref ? `tel:${dialHref}` : undefined

    return (
        <Section id="contact" theme={theme}>
            <div className="mx-auto max-w-(--content-width)">
                <SectionHeader title={t('title')} subtitle={t('subtitle')}/>
                <ul className="mx-auto mt-10 flex max-w-md flex-col gap-8 text-center sm:text-left">
                    <li>
                        <p className="mb-2 text-small font-medium uppercase tracking-wide text-text-secondary">
                            {t('phoneLabel')}
                        </p>
                        {telHref ? (
                            <a href={telHref} className={linkClassName}>
                                {CONTACT.phone}
                            </a>
                        ) : (
                            <span className="text-body text-text-primary">{CONTACT.phone}</span>
                        )}
                    </li>
                    <li>
                        <p className="mb-2 text-small font-medium uppercase tracking-wide text-text-secondary">
                            {t('emailLabel')}
                        </p>
                        <a
                            href={`mailto:${CONTACT.email}`}
                            className={linkClassName}
                        >
                            {t('emailLink')}
                        </a>
                    </li>
                </ul>
            </div>
        </Section>
    )
}
