import {DonateSection} from '@widgets/donate-section'
import {DressCodeSection} from '@widgets/dresscode-section'
import {GallerySection} from '@widgets/gallery-section'
import {HeroSection} from '@widgets/hero-section'
import {OurStorySection} from '@widgets/our-story-section'
import {RsvpSection} from '@widgets/rsvp-section'
import {ScheduleSection} from '@widgets/schedule-section'
import {WelcomeSection} from '@widgets/welcome-section'
import {WishesSection} from '@widgets/wishes-section'

export default async function Home() {
    return (
        <>
            <HeroSection/>
            <WelcomeSection/>
            <ScheduleSection/>
            <DressCodeSection/>
            <OurStorySection/>
            <RsvpSection/>
            <GallerySection presentation="preview"/>
            <WishesSection presentation="preview"/>
            <DonateSection/>
        </>
    )
}
