import type {SectionTheme} from '@shared/ui'

/** Props for the default home-page section (async wiring + `Section`). */
export type ContactSectionProps = Readonly<{
    theme?: SectionTheme
}>

/** One row: translated label, visible text, optional outbound href (`tel:` / `mailto:`). */
export type ContactMethodRowModel = Readonly<{
    label: string
    text: string
    href?: string
}>

/** Presentational block: localized title/subtitle and two contact rows (pass mocks for Storybook / tests). */
export type ContactSectionBodyProps = Readonly<{
    title: string
    subtitle: string
    phone: ContactMethodRowModel
    email: ContactMethodRowModel & {href: string}
}>
