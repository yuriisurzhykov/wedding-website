import {getLocale, getTranslations} from "next-intl/server";

import {getViewerGuestAccountIdFromServerCookies} from "@features/guest-session/server";
import {Countdown} from "@shared/ui";
import {ExternalLinkIcon} from "@shared/ui/icons/ExternalLinkIcon";
import {formatHeroWeddingLine, formatHeroWeddingStartTime, getWeddingCeremonyDate,} from "@shared/lib/wedding-calendar";
import {VENUE} from '@entities/wedding-venue'

import {HeroBotanicalBackdrop} from "./HeroBotanicalBackdrop";
import {HeroGoToRsvpButton} from "./HeroGoToRsvpButton";

export async function HeroSection() {
    const locale = await getLocale();
    const translator = await getTranslations("hero");
    const viewerGuestAccountId = await getViewerGuestAccountIdFromServerCookies();
    const weddingDateLabel = formatHeroWeddingLine(locale);
    const weddingStartTimeLabel = formatHeroWeddingStartTime(locale);

    return (
        <section
            className="hero-mesh flex min-h-screen flex-col items-center justify-center px-4 text-center"
        >
            <HeroBotanicalBackdrop/>
            <div className="flex w-full max-w-4xl flex-col items-center">
                <p
                    className="font-accent mb-2 text-[2rem] text-accent"
                    aria-hidden
                >
                    …two become one…
                </p>

                <h1 className="font-display mb-4 text-hero text-text-primary">
                    {translator("names")}
                </h1>

                <p className="font-display mb-3 max-w-2xl text-balance text-h2 text-text-primary">
                    {translator("date", {date: weddingDateLabel})}
                </p>

                <p className="font-display mb-3 max-w-2xl text-balance text-h2 text-text-primary">
                    {weddingStartTimeLabel}
                </p>

                <a
                    href={VENUE.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={translator("venueLinkAria")}
                    className="mb-12 inline-flex max-w-xl items-center justify-center gap-2 text-center text-small font-medium text-text-secondary underline decoration-primary decoration-2 underline-offset-[5px] transition-colors hover:text-primary hover:decoration-primary-dark"
                >
                    <span>{translator("venue")}</span>
                    <ExternalLinkIcon className="h-4 w-4 shrink-0 text-primary opacity-90"/>
                </a>
                <Countdown targetDate={getWeddingCeremonyDate()}/>
                {viewerGuestAccountId === null ? (
                    <HeroGoToRsvpButton>{translator("goToRsvp")}</HeroGoToRsvpButton>
                ) : null}
            </div>
        </section>
    );
}
