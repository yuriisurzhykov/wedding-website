import type {ContactMethodRowModel} from '../model/types'

import {CONTACT_SECTION_LINK_CLASSNAME} from './contact-link-classname'

const LABEL_CLASSNAME =
    'mb-2 text-small font-medium uppercase tracking-wide text-text-secondary'

type Props = ContactMethodRowModel

/**
 * Single `<li>`: caption + link or plain text when `href` is absent (e.g. undializable phone).
 */
export function ContactMethodRow({label, text, href}: Props) {
    return (
        <li>
            <p className={LABEL_CLASSNAME}>{label}</p>
            {href ? (
                <a href={href} className={CONTACT_SECTION_LINK_CLASSNAME}>
                    {text}
                </a>
            ) : (
                <span className="text-body text-text-primary">{text}</span>
            )}
        </li>
    )
}
