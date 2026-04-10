import {isSiteFeatureEnabled} from '@entities/site-features'
import {getViewerRsvpIdFromServerCookies} from '@features/guest-session/server'
import {
    alignHomeThemesAfterSkippedRsvpBand,
    homeSectionThemeAt,
} from '@shared/lib/home-section-themes'
import {DonateSection} from '@widgets/donate-section'
import {DressCodeSection} from '@widgets/dresscode-section'
import {GallerySection} from '@widgets/gallery-section'
import {HeroSection} from '@widgets/hero-section'
import {OurStorySection} from '@widgets/our-story-section'
import {RsvpSection, RsvpSectionGate} from '@widgets/rsvp-section'
import {ScheduleSection} from '@widgets/schedule-section'
import {WelcomeSection} from '@widgets/welcome-section'
import {WishesSection} from '@widgets/wishes-section'

export default async function Home() {
    const viewerRsvpId = await getViewerRsvpIdFromServerCookies()
    /** Matches client `RsvpSectionGate`: no RSVP band when guest session cookie is present. */
    const rsvpSlotSkippedOnHome = viewerRsvpId !== null

    let sectionIndex = 0
    const nextSectionTheme = () => homeSectionThemeAt(sectionIndex++)
    const showOurStory = isSiteFeatureEnabled('ourStory')

    const themeWelcome = nextSectionTheme()
    const themeSchedule = nextSectionTheme()
    const themeDress = nextSectionTheme()
    const themeOurStory = showOurStory ? nextSectionTheme() : null
    const themeRsvp = nextSectionTheme()
    const postRsvp = alignHomeThemesAfterSkippedRsvpBand(rsvpSlotSkippedOnHome, {
        gallery: nextSectionTheme(),
        wishes: nextSectionTheme(),
        donate: nextSectionTheme(),
    })

    return (
        <>
            <HeroSection/>
            <WelcomeSection theme={themeWelcome}/>
            <ScheduleSection theme={themeSchedule}/>
            <DressCodeSection theme={themeDress}/>
            {showOurStory ? <OurStorySection theme={themeOurStory!}/> : null}
            <RsvpSectionGate>
                <RsvpSection theme={themeRsvp}/>
            </RsvpSectionGate>
            <GallerySection
                presentation="preview"
                theme={postRsvp.gallery}
            />
            <WishesSection
                presentation="preview"
                theme={postRsvp.wishes}
            />
            <DonateSection theme={postRsvp.donate}/>
        </>
    )
}
