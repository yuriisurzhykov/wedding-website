import {useTranslations} from "next-intl";

import {Countdown} from "@/components/ui/Countdown";
import {VENUE, WEDDING_DATE} from "@/lib/constants";

export function Hero() {
    const translator = useTranslations("hero");

    return (
        <section
            className="flex min-h-screen flex-col items-center justify-center px-4 text-center"
            style={{background: "var(--gradient-hero)"}}
        >
            <p
                className="font-accent mb-2 text-[2rem] text-accent"
                aria-hidden
            >forever</p>

            <h1 className="font-display mb-4 text-hero text-text-primary">
                {translator("names")}
            </h1>

            <p className="font-display mb-2 text-h3 text-text-secondary">{translator("date")}</p>

            <a
                href={VENUE.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mb-12 text-small text-text-muted underline-offset-4 transition-colors hover:text-primary hover:underline"
            >
                {translator("venue")}
            </a>

            <Countdown targetDate={WEDDING_DATE}/>
        </section>
    );
}
