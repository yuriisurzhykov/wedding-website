import {DressCode, Hero, OurStory, Schedule, Welcome} from "@/components/sections";
import {Navigation} from "@/components/ui/Navigation";
import {RsvpSection} from "@widgets/rsvp-section";

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
            <Navigation/>
            <main className="flex flex-col pt-16">
                <Hero/>
                <Welcome/>
                <Schedule/>
                <DressCode/>
                <OurStory/>
                <RsvpSection/>
                <NavAnchorStubs/>
            </main>
        </>
    );
}
