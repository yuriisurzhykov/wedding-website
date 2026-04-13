# Widget: contact-section

Section `#contact` on the home page: localized heading and `tel:` / `mailto:` actions using **`CONTACT`** from
`@entities/wedding-venue` (single source of truth; no duplicated email/phone in UI).

## Purpose

- Lets guests call or write using the device’s phone app and mail client.
- Does **not** host a contact form or API; `mailto:` covers “send an email” for this slice.

## Approach

- **Server component** (`getTranslations('contact')`).
- Phone dial URI via `toDialString` from `@shared/lib/phone` (leading `+` preserved for international numbers).

## Public API

- **`ContactSection`**: optional `theme?: SectionTheme` (default `'alt'`), passed to `@shared/ui` `Section`.

## Usage

```tsx
import {ContactSection} from '@widgets/contact-section'

// …
<ContactSection theme={postRsvp.contact} />
```

## Extending

- Change copy: `messages/en.json` and `messages/ru.json` under the `contact` namespace.
- Change numbers/address: `@entities/wedding-venue` `CONTACT` (and feature docs if admin editing is added later).

## Errors & edge cases

- If `CONTACT.phone` normalizes to an empty dial string, the phone line renders plain text (no broken `tel:` link).
