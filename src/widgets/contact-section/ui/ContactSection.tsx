import {getTranslations} from 'next-intl/server'

import {getContactInfo, getContactMailtoHref, getContactTelHref,} from '@entities/wedding-venue'
import {Section} from '@shared/ui'

import type {ContactSectionProps} from '../model/types'

import {ContactSectionBody} from './ContactSectionBody'

type Props = ContactSectionProps

/**
 * Contact section: loads copy and venue contact facts, then composes `Section` + `ContactSectionBody`.
 */
export async function ContactSection({theme = 'alt'}: Props = {}) {
    const t = await getTranslations('contact')
    const contact = getContactInfo()
    const telHref = getContactTelHref()
    const mailtoHref = getContactMailtoHref()

    return (
        <Section id="contact" theme={theme}>
            <ContactSectionBody
                title={t('title')}
                subtitle={t('subtitle')}
                phone={{
                    label: t('phoneLabel'),
                    text: contact.phone,
                    href: telHref,
                }}
                email={{
                    label: t('emailLabel'),
                    text: t('emailLink'),
                    href: mailtoHref,
                }}
            />
        </Section>
    )
}
