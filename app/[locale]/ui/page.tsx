import type {Metadata} from 'next'
import {setRequestLocale} from 'next-intl/server'
import {Button, Input, Section, SectionHeader, Select, TextArea} from '@shared/ui'
import {UIBookClientSections} from './ui-book-client'

const longPlaceholder =
    'Very long placeholder text to stress the control layout and wrapping behavior in the component book.'

type Props = Readonly<{
    params: Promise<{ locale: string }>
}>

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: 'UI book',
        robots: {index: false, follow: false},
    }
}

export default async function UIBookPage({params}: Props) {
    const {locale} = await params
    setRequestLocale(locale)

    const variants = ['primary', 'secondary', 'ghost', 'outline'] as const
    const sizes = ['sm', 'md', 'lg'] as const

    return (
        <main className="min-h-dvh bg-bg-base pb-24 pt-8">
            <div
                className="mx-auto px-4 sm:px-8"
                style={{maxWidth: 'var(--max-width)'}}
            >
                <header className="mb-12">
                    <h1 className="font-display text-hero text-text-primary mb-2">
                        Component book
                    </h1>
                    <p className="text-body text-text-secondary max-w-(--content-width)">
                        Internal catalog of UI primitives and main states. Not linked from
                        public navigation.
                    </p>
                    <nav
                        className="mt-8 flex flex-wrap gap-x-4 gap-y-2 text-small text-primary"
                        aria-label="On this page"
                    >
                        <a href="#button" className="underline underline-offset-2">
                            Button
                        </a>
                        <a href="#input" className="underline underline-offset-2">
                            Input
                        </a>
                        <a href="#textarea" className="underline underline-offset-2">
                            Textarea
                        </a>
                        <a href="#select" className="underline underline-offset-2">
                            Select
                        </a>
                        <a href="#section" className="underline underline-offset-2">
                            Section
                        </a>
                        <a
                            href="#language-switcher"
                            className="underline underline-offset-2"
                        >
                            LanguageSwitcher
                        </a>
                        <a href="#navigation" className="underline underline-offset-2">
                            SiteNavigation
                        </a>
                        <a href="#countdown" className="underline underline-offset-2">
                            Countdown
                        </a>
                        <a href="#dynamic-form" className="underline underline-offset-2">
                            DynamicForm
                        </a>
                        <a href="#photo-uploader" className="underline underline-offset-2">
                            PhotoUploader
                        </a>
                        <a
                            href="#deep-link-button"
                            className="underline underline-offset-2"
                        >
                            DeepLinkButton
                        </a>
                    </nav>
                </header>

                <div className="flex flex-col gap-4">
                    <Section id="button" theme="base" className="py-10! scroll-mt-24">
                        <SectionHeader
                            title="Button"
                            subtitle="Variant × size matrix, plus disabled row."
                        />
                        <div className="space-y-8">
                            {sizes.map((size) => (
                                <div key={size}>
                                    <p className="text-small text-text-muted mb-3 capitalize">
                                        Size: {size}
                                    </p>
                                    <div className="flex flex-wrap gap-3">
                                        {variants.map((variant) => (
                                            <Button key={variant} variant={variant} size={size}>
                                                {variant}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            <div>
                                <p className="text-small text-text-muted mb-3">Disabled</p>
                                <div className="flex flex-wrap gap-3">
                                    {variants.map((variant) => (
                                        <Button key={variant} variant={variant} disabled>
                                            {variant}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Section>

                    <Section id="input" theme="alt" className="py-10! scroll-mt-24">
                        <SectionHeader
                            title="Input"
                            subtitle="Default, disabled, long placeholder, invalid."
                        />
                        <div className="grid max-w-xl gap-6">
                            <Input
                                aria-label="Example text input"
                                placeholder="Your name"
                                defaultValue=""
                            />
                            <Input
                                aria-label="Disabled input"
                                placeholder="Disabled"
                                disabled
                            />
                            <Input
                                aria-label="Long placeholder"
                                placeholder={longPlaceholder}
                            />
                            <Input
                                aria-label="Invalid input"
                                placeholder="Invalid"
                                aria-invalid
                                className="border-red-500 focus:border-red-500 focus:ring-red-500/40"
                            />
                        </div>
                    </Section>

                    <Section id="textarea" theme="base" className="py-10! scroll-mt-24">
                        <SectionHeader
                            title="Textarea"
                            subtitle="Default, disabled, long placeholder, invalid."
                        />
                        <div className="grid max-w-xl gap-6">
                            <TextArea
                                aria-label="Example textarea"
                                placeholder="Message"
                                rows={4}
                            />
                            <TextArea
                                aria-label="Disabled textarea"
                                placeholder="Disabled"
                                rows={3}
                                disabled
                            />
                            <TextArea
                                aria-label="Long placeholder textarea"
                                placeholder={longPlaceholder}
                                rows={3}
                            />
                            <TextArea
                                aria-label="Invalid textarea"
                                placeholder="Invalid"
                                rows={3}
                                aria-invalid
                                className="border-red-500 focus:border-red-500 focus:ring-red-500/40"
                            />
                        </div>
                    </Section>

                    <Section id="select" theme="alt" className="py-10! scroll-mt-24">
                        <SectionHeader
                            title="Select"
                            subtitle="Default, disabled, long first option, invalid."
                        />
                        <div className="grid max-w-xl gap-6">
                            <Select aria-label="Example select" defaultValue="b">
                                <option value="a">Option A</option>
                                <option value="b">Option B</option>
                                <option value="c">Option C</option>
                            </Select>
                            <Select aria-label="Disabled select" disabled defaultValue="a">
                                <option value="a">Option A</option>
                                <option value="b">Option B</option>
                            </Select>
                            <Select aria-label="Long options select" defaultValue="">
                                <option value="">{longPlaceholder}</option>
                                <option value="x">Short</option>
                            </Select>
                            <Select
                                aria-label="Invalid select"
                                aria-invalid
                                defaultValue="a"
                                className="border-red-500 focus:border-red-500 focus:ring-red-500/40"
                            >
                                <option value="a">Option A</option>
                                <option value="b">Option B</option>
                            </Select>
                        </div>
                    </Section>

                    <div id="section" className="scroll-mt-24">
                        <SectionHeader
                            title="Section + SectionHeader"
                            subtitle="Themes: base, alt, and dark (data-theme)."
                            className="pt-4"
                        />
                        <Section theme="base" className="py-10! rounded-lg">
                            <SectionHeader
                                title="Base section"
                                subtitle="Background bg-bg-base via Section."
                            />
                            <p className="text-body text-text-primary text-center">
                                Sample body copy on the default surface.
                            </p>
                        </Section>
                        <Section theme="alt" className="py-10! rounded-lg">
                            <SectionHeader
                                title="Alt section"
                                subtitle="Muted band for contrast."
                            />
                            <p className="text-body text-text-primary text-center">
                                Sample body copy on the alternate surface.
                            </p>
                        </Section>
                        <Section theme="dark" className="py-10! rounded-lg">
                            <SectionHeader
                                title="Dark section"
                                subtitle="Inverted palette via data-theme."
                            />
                            <p className="text-body text-center text-text-on-primary">
                                Sample body copy on the dark surface.
                            </p>
                        </Section>
                    </div>

                    <Section theme="base" className="py-10! scroll-mt-24">
                        <SectionHeader
                            title="Client widgets"
                            subtitle="These use next-intl on the client; the [locale] layout supplies NextIntlClientProvider."
                        />
                        <div className="flex flex-col gap-16">
                            <UIBookClientSections/>
                        </div>
                    </Section>
                </div>
            </div>
        </main>
    )
}
