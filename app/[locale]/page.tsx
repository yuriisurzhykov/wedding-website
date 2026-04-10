import {isSiteFeatureEnabled} from '@entities/site-features'
import {getViewerRsvpIdFromServerCookies} from '@features/guest-session/server'
import {FeatureGate} from '@features/site-settings/client'
import {getSiteSettingsCached} from '@features/site-settings'
import {
    alignHomeThemesAfterSkippedRsvpBand,
    homeSectionThemeAt,
} from '@shared/lib/home-section-themes'
import {resolveScheduleItems} from '@shared/lib/wedding-calendar'
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

    const siteSettings = await getSiteSettingsCached()
    const showScheduleSection = siteSettings.capabilities.scheduleSection
    const showRsvpSection = siteSettings.capabilities.rsvp
    const showWishesSection = siteSettings.capabilities.wishSubmit
    const scheduleItems = showScheduleSection
        ? resolveScheduleItems(siteSettings.schedule_program)
        : []

    let sectionIndex = 0
    const nextSectionTheme = () => homeSectionThemeAt(sectionIndex++)
    const showOurStory = isSiteFeatureEnabled('ourStory')

    const themeWelcome = nextSectionTheme()
    const themeSchedule = showScheduleSection ? nextSectionTheme() : null
    const themeDress = nextSectionTheme()
    const themeOurStory = showOurStory ? nextSectionTheme() : null
    const themeRsvp = showRsvpSection ? nextSectionTheme() : null
    const themeGallery = nextSectionTheme()
    const themeWishes = showWishesSection ? nextSectionTheme() : null
    const themeDonate = nextSectionTheme()
    const postRsvp = alignHomeThemesAfterSkippedRsvpBand(
        rsvpSlotSkippedOnHome || !showRsvpSection,
        {
            gallery: themeGallery,
            wishes: themeWishes ?? themeGallery,
            donate: themeDonate,
        },
    )

    return (
        <>
            <HeroSection/>
            <WelcomeSection theme={themeWelcome}/>
            {showScheduleSection && themeSchedule !== null ? (
                <FeatureGate capability="scheduleSection">
                    <ScheduleSection items={scheduleItems} theme={themeSchedule}/>
                </FeatureGate>
            ) : null}
            <DressCodeSection theme={themeDress}/>
            {showOurStory ? <OurStorySection theme={themeOurStory!}/> : null}
            {showRsvpSection && themeRsvp !== null ? (
                <FeatureGate capability="rsvp">
                    <RsvpSectionGate>
                        <RsvpSection theme={themeRsvp}/>
                    </RsvpSectionGate>
                </FeatureGate>
            ) : null}
            <GallerySection
                presentation="preview"
                theme={postRsvp.gallery}
            />
            {showWishesSection ? (
                <FeatureGate capability="wishSubmit">
                    <WishesSection
                        presentation="preview"
                        theme={postRsvp.wishes}
                    />
                </FeatureGate>
            ) : null}
            <DonateSection theme={postRsvp.donate}/>
        </>
    )
}
