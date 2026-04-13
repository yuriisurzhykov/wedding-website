import {SectionHeader} from '@shared/ui'

import type {ContactSectionBodyProps} from '../model/types'

import {ContactMethodRow} from './ContactMethodRow'

/**
 * Inner layout: heading and the contact list. No `Section` wrapper — use from `ContactSection` or tests with mock copy.
 */
export function ContactSectionBody(
    {
        title,
        subtitle,
        phone,
        email,
    }: ContactSectionBodyProps
) {
    return (
        <div className="mx-auto max-w-(--content-width)">
            <SectionHeader title={title} subtitle={subtitle}/>
            <ul className="mx-auto mt-10 flex max-w-md flex-col items-center gap-8 text-center">
                <ContactMethodRow {...phone} />
                <ContactMethodRow {...email} />
            </ul>
        </div>
    )
}
