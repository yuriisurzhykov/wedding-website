import {DressCodeSection} from "@widgets/dresscode-section";
import {HeroSection} from "@widgets/hero-section";
import {OurStorySection} from "@widgets/our-story-section";
import {RsvpSection} from "@widgets/rsvp-section";
import {ScheduleSection} from "@widgets/schedule-section";
import {SiteNavigation} from "@widgets/site-navigation";
import {WelcomeSection} from "@widgets/welcome-section";

/** Scroll targets for nav items not yet implemented (Phases 5–7). */
function NavAnchorStubs() {
    return (
        <>
            <section id="gallery" className="scroll-mt-16" aria-hidden/>
            <section id="wishes" className="scroll-mt-16" aria-hidden/>
            <section id="donate" className="scroll-mt-16" aria-hidden/>
        </>
    );
}

export default async function Home() {
    return (
        <>
            <SiteNavigation/>
            <main className="flex flex-col pt-16">
                <HeroSection/>
                <WelcomeSection/>
                <ScheduleSection/>
                <DressCodeSection/>
                <OurStorySection/>
                <RsvpSection/>
                <NavAnchorStubs/>
            </main>
        </>
    );
}
