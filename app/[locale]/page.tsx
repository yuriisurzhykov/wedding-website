import {DressCode, Hero, OurStory, Schedule, Welcome} from "@/components/sections";

export default function Home() {
    return (
        <main className="flex flex-col">
            <Hero/>
            <Welcome/>
            <Schedule/>
            <DressCode/>
            <OurStory/>
        </main>
    )
}
