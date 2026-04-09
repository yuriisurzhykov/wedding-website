import type {Metadata} from "next";
import {getTranslations} from "next-intl/server";

import {Link} from "@/i18n/navigation";
import {GuestSessionRestoreForm} from "@features/guest-session";
import {Section} from "@shared/ui";

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations("guestSession.signInPage");
    return {
        title: t("documentTitle"),
        robots: {index: false, follow: false},
    };
}

export default async function GuestSignInPage() {
    const t = await getTranslations("guestSession.restore");

    return (
        <Section id="guest-sign-in" theme="base">
            <div className="mx-auto max-w-lg py-8">
                <GuestSessionRestoreForm layout="page" showFullPageLink={false}/>
                <p className="mt-10 text-small text-text-secondary">
                    <Link
                        href={{pathname: "/", hash: "rsvp"}}
                        className="text-primary underline decoration-primary/40 underline-offset-4 transition hover:decoration-primary"
                    >
                        {t("rsvpLink")}
                    </Link>
                </p>
            </div>
        </Section>
    );
}
