import {getTranslations} from "next-intl/server";

import {DeepLinkButton, isPaymentConfigured, PAYMENT_SERVICES,} from "@entities/payments";
import {Section, SectionHeader, type SectionTheme} from "@shared/ui";

type Props = Readonly<{
    theme?: SectionTheme;
}>;

/**
 * Gift / donate section with deep-link buttons from `@entities/payments`.
 */
export async function DonateSection({theme = "alt"}: Props = {}) {
    const t = await getTranslations("donate");
    const services = PAYMENT_SERVICES.filter(isPaymentConfigured);

    return (
        <Section id="donate" theme={theme}>
            <div className="mx-auto max-w-[var(--content-width)]">
                <SectionHeader title={t("title")} subtitle={t("subtitle")}/>
                {services.length > 0 ? (
                    <ul className="mx-auto mt-10 flex max-w-md flex-col gap-4">
                        {services.map((service) => (
                            <li key={service.id}>
                                <DeepLinkButton service={service}/>
                            </li>
                        ))}
                    </ul>
                ) : null}
                <p className="mt-8 text-center text-small text-text-secondary">
                    {t("noFees")}
                </p>
            </div>
        </Section>
    );
}
