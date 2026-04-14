import {getTranslations} from 'next-intl/server'

import {getSiteSettingsCached} from '@features/site-settings'
import {toDialString} from '@shared/lib/phone'
import {Section} from '@shared/ui'

import type {ContactSectionProps} from '../model/types'

import {ContactSectionBody} from './ContactSectionBody'

type Props = ContactSectionProps

/**
 * Contact section: loads copy and public contact (DB-backed with venue defaults), then composes `Section` +
 * `ContactSectionBody`.
 */
export async function ContactSection({theme = 'alt'}: Props = {}) {
    const t = await getTranslations('contact')
    const {public_contact: contact} = await getSiteSettingsCached()
    const dial = toDialString(contact.phone)
    const telHref = dial ? `tel:${dial}` : undefined
    const mailtoHref = `mailto:${contact.email.trim()}`

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
