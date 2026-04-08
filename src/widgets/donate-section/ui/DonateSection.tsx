import {getTranslations} from "next-intl/server";

import {
    DeepLinkButton,
    PAYMENT_SERVICES,
    ZELLE_PHONE_NUMBER,
} from "@entities/payments";
import {Section, SectionHeader} from "@shared/ui";

function isPaymentConfigured(
    service: (typeof PAYMENT_SERVICES)[number],
): boolean {
    if (service.id === "zelle") {
        return ZELLE_PHONE_NUMBER.length > 0;
    }
    return Boolean(service.deepLink || service.fallback);
}

/**
 * Gift / donate section with deep-link buttons from `@entities/payments`.
 */
export async function DonateSection() {
    const t = await getTranslations("donate");
    const services = PAYMENT_SERVICES.filter(isPaymentConfigured);

    return (
        <Section id="donate" theme="base">
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
