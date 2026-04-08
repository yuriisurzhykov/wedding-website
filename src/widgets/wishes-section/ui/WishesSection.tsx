import {getTranslations} from "next-intl/server";

import {cn} from "@shared/lib/cn";
import {Section, SectionHeader} from "@shared/ui";

import {listWishes} from "@features/wish-list";

import {wishesListLimitForPresentation, type WishesPresentation,} from "../lib/wishes-presentation";
import {WishesFeedClient, type WishesFeedClientSlots,} from "./WishesFeedClient";
import {WishesSectionForm} from "./WishesSectionForm";

export type {WishesPresentation};

export type WishesSectionOptions = {
    slots?: WishesFeedClientSlots & {
        /** Merged into the wish form root (`<form>`). */
        form?: string;
    };
};

type WishesSectionProps = {
    /** Home preview vs full wishes page; drives list limits inside the slice. */
    presentation?: WishesPresentation;
    /** Merged into the root `Section`. */
    className?: string;
    /** Merged into the inner content column. */
    contentClassName?: string;
    options?: WishesSectionOptions;
};

/**
 * Wishes block: server-loaded feed (or empty hint), with the wish form below the hint when the list is empty, otherwise above the feed.
 */
export async function WishesSection(
    {
        presentation = "preview",
        className,
        contentClassName,
        options,
    }: WishesSectionProps = {}
) {
    const t = await getTranslations("wishes");
    const limit = wishesListLimitForPresentation(presentation);
    const result = await listWishes({limit, offset: 0});
    const wishes = result.ok ? result.wishes : [];
    const hasMore = result.ok ? result.hasMore : false;

    if (!result.ok) {
        console.error("[WishesSection] listWishes", result.kind, result.message);
    }

    const {form: formSlot, ...feedSlots} = options?.slots ?? {};

    return (
        <Section id="wishes" theme="alt" className={className}>
            <div
                className={cn(
                    "mx-auto max-w-(--content-width)",
                    contentClassName,
                )}
            >
                <SectionHeader title={t("title")} subtitle={t("subtitle")}/>
                <WishesFeedClient
                    form={<WishesSectionForm className={formSlot}/>}
                    initialWishes={wishes}
                    initialHasMore={hasMore}
                    presentation={presentation}
                    slots={feedSlots}
                />
            </div>
        </Section>
    );
}
