import type {Metadata} from "next";
import {getTranslations} from "next-intl/server";

import {Link} from "@/i18n/navigation";
import {Section} from "@shared/ui";

type Props = Readonly<{
    searchParams: Promise<{ error?: string }>;
}>;

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("guestClaim");
    return {
        title: t("pageTitle"),
        robots: {index: false, follow: false},
    };
}

export default async function GuestClaimPage({searchParams}: Props) {
    const {error} = await searchParams;
    const t = await getTranslations("guestClaim");

    const isServerError = error === "server_error";
    const isRateLimited = error === "too_many_requests";

    return (
        <Section id="guest-claim" theme="base">
            <div className="mx-auto max-w-lg py-8">
                {isRateLimited ? (
                    <>
                        <h1 className="font-display text-2xl text-text-primary">
                            {t("rateLimitedTitle")}
                        </h1>
                        <p className="mt-4 text-base leading-relaxed text-text-secondary">
                            {t("rateLimitedDescription")}
                        </p>
                    </>
                ) : isServerError ? (
                    <>
                        <h1 className="font-display text-2xl text-text-primary">
                            {t("serverErrorTitle")}
                        </h1>
                        <p className="mt-4 text-base leading-relaxed text-text-secondary">
                            {t("serverErrorDescription")}
                        </p>
                    </>
                ) : (
                    <>
                        <h1 className="font-display text-2xl text-text-primary">
                            {t("invalidTitle")}
                        </h1>
                        <p className="mt-4 text-base leading-relaxed text-text-secondary">
                            {t("invalidDescription")}
                        </p>
                    </>
                )}
                <p className="mt-8">
                    <Link
                        href="/guest/sign-in"
                        className="text-primary underline decoration-primary/40 underline-offset-4 transition hover:decoration-primary"
                    >
                        {t("signInCta")}
                    </Link>
                </p>
                <p className="mt-4">
                    <Link
                        href="/"
                        className="text-primary underline decoration-primary/40 underline-offset-4 transition hover:decoration-primary"
                    >
                        {t("backHome")}
                    </Link>
                </p>
            </div>
        </Section>
    );
}
