# Widget: contact-section

Section `#contact` on the home page: localized heading and `tel:` / `mailto:` actions using **`getContactInfo` /
`getContactTelHref` / `getContactMailtoHref`** from `@entities/wedding-venue` (single source of truth; no duplicated
email/phone in UI).

## Purpose

- Lets guests call or write using the device’s phone app and mail client.
- Does **not** host a contact form or API; `mailto:` covers “send an email” for this slice.

## Approach

- **`ContactSection`** is an async **server component**: `getTranslations('contact')` plus `@entities/wedding-venue` getters; it only composes `Section` and **`ContactSectionBody`**.
- Presentation is split: **`ContactMethodRow`** (one list item), **`ContactSectionBody`** (header + list), shared link styling in **`contact-link-classname.ts`**.
- Phone dial URI comes from `@entities/wedding-venue` `getContactTelHref()` (uses `toDialString` inside the entity).

## Public API

- **`ContactSection`**: optional `theme?: SectionTheme` (default `'alt'`), passed to `@shared/ui` `Section`.
- **`ContactSectionBody`**: synchronous; accepts localized `title` / `subtitle` and structured `phone` / `email` rows (`ContactSectionBodyProps`). Use for Storybook, tests, or alternate pages without duplicating markup.
- **Types**: `ContactSectionProps`, `ContactSectionBodyProps`, `ContactMethodRowModel`.

## Usage

```tsx
import {ContactSection} from '@widgets/contact-section'

// …
<ContactSection theme={postRsvp.contact} />
```

Mock or alternate wiring:

```tsx
import {ContactSectionBody} from '@widgets/contact-section'

<ContactSectionBody
  title="…"
  subtitle="…"
  phone={{label: '…', text: '+1 …', href: 'tel:…'}}
  email={{label: '…', text: 'Write us', href: 'mailto:…'}}
/>
```

## Extending

- Change copy: `messages/en.json` and `messages/ru.json` under the `contact` namespace.
- Change numbers/address: `@entities/wedding-venue` `model/venue.ts` (venue and contact definitions) and feature docs if admin editing is added later.

## Errors & edge cases

- If `getContactTelHref()` is `undefined`, the phone line renders plain text (no broken `tel:` link).
