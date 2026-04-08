import {getTranslations} from "next-intl/server";

import {Section, SectionHeader} from "@shared/ui";

import {listWishes} from "@features/wish-list";

import {WishesFeed} from "./WishesFeed";
import {WishesSectionForm} from "./WishesSectionForm";

/**
 * Wishes block: server-loaded feed and client form posting to `POST /api/wishes`.
 */
export async function WishesSection() {
    const t = await getTranslations("wishes");
    const result = await listWishes(50);
    const wishes = result.ok ? result.wishes : [];

    if (!result.ok) {
        console.error("[WishesSection] listWishes", result.kind, result.message);
    }

    return (
        <Section id="wishes" theme="alt">
            <div className="mx-auto max-w-[var(--content-width)]">
                <SectionHeader title={t("title")} subtitle={t("subtitle")}/>
                {wishes.length === 0 ? (
                    <p className="mt-6 text-center text-body text-text-secondary">
                        {t("empty")}
                    </p>
                ) : (
                    <WishesFeed wishes={wishes}/>
                )}
                <WishesSectionForm/>
            </div>
        </Section>
    );
}
