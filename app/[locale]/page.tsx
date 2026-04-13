import {getViewerRsvpIdFromServerCookies} from '@features/guest-session/server'
import {getResolvedGuestSchedule} from '@features/wedding-schedule'
import {
    FeatureGate,
    GalleryHomeGate,
    SectionFeaturePreview,
} from '@features/site-settings/client'
import {getSiteSettingsCached} from '@features/site-settings'
import {
    alignHomeThemesAfterSkippedRsvpBand,
    homeSectionThemeAt,
} from '@shared/lib/home-section-themes'
import {ContactSection} from '@widgets/contact-section'
import {DonateSection} from '@widgets/donate-section'
import {DressCodeSection} from '@widgets/dresscode-section'
import {GallerySection} from '@widgets/gallery-section'
import {HeroSection} from '@widgets/hero-section'
import {OurStorySection} from '@widgets/our-story-section'
import {RsvpSection, RsvpSectionGate} from '@widgets/rsvp-section'
import {ScheduleSection} from '@widgets/schedule-section'
import {WelcomeSection} from '@widgets/welcome-section'
import {WishesSection} from '@widgets/wishes-section'
import {getLocale} from 'next-intl/server'

export default async function Home() {
    const viewerRsvpId = await getViewerRsvpIdFromServerCookies()
    /** Matches client `RsvpSectionGate`: no RSVP band when guest session cookie is present. */
    const rsvpSlotSkippedOnHome = viewerRsvpId !== null

    const locale = await getLocale()
    const [siteSettings, resolvedSchedule] = await Promise.all([
        getSiteSettingsCached(),
        getResolvedGuestSchedule(locale),
    ])
    const showScheduleSection = siteSettings.capabilities.scheduleSection !== 'hidden'
    const showRsvpSection = siteSettings.capabilities.rsvp !== 'hidden'
    const showGallerySection = siteSettings.capabilities.galleryBrowse !== 'hidden'
    const showWishesSection = siteSettings.capabilities.wishSubmit !== 'hidden'

    const scheduleHeaders = resolvedSchedule.sectionHeaders
    const scheduleItems = showScheduleSection ? resolvedSchedule.items : []

    let sectionIndex = 0
    const nextSectionTheme = () => homeSectionThemeAt(sectionIndex++)
    const showOurStory = siteSettings.capabilities.ourStory !== 'hidden'

    const themeWelcome = nextSectionTheme()
    const themeSchedule = showScheduleSection ? nextSectionTheme() : null
    const themeDress = nextSectionTheme()
    const themeOurStory = showOurStory ? nextSectionTheme() : null
    const themeRsvp = showRsvpSection ? nextSectionTheme() : null
    const themeGallery = showGallerySection ? nextSectionTheme() : null
    const themeWishes = showWishesSection ? nextSectionTheme() : null
    const themeDonate = nextSectionTheme()
    const themeContact = nextSectionTheme()
    const postRsvp = alignHomeThemesAfterSkippedRsvpBand(
        rsvpSlotSkippedOnHome || !showRsvpSection,
        {
            gallery: themeGallery ?? themeWishes ?? themeDonate,
            wishes: themeWishes ?? themeGallery ?? themeDonate,
            donate: themeDonate,
            contact: themeContact,
        },
    )

    return (
        <>
            <HeroSection/>
            <WelcomeSection theme={themeWelcome}/>
            {showScheduleSection && themeSchedule !== null ? (
                <FeatureGate
                    capability="scheduleSection"
                    preview={
                        <SectionFeaturePreview
                            sectionId="schedule"
                            theme={themeSchedule}
                            messageNamespace="schedule"
                        />
                    }
                >
                    <ScheduleSection
                        items={scheduleItems}
                        theme={themeSchedule}
                        headerTitle={scheduleHeaders.title}
                        headerSubtitle={scheduleHeaders.subtitle}
                        emphasisBadgeText={scheduleHeaders.emphasisBadge}
                    />
                </FeatureGate>
            ) : null}
            <DressCodeSection theme={themeDress}/>
            {showOurStory && themeOurStory !== null ? (
                <FeatureGate
                    capability="ourStory"
                    preview={
                        <SectionFeaturePreview
                            sectionId="story"
                            theme={themeOurStory}
                            messageNamespace="story"
                        />
                    }
                >
                    <OurStorySection theme={themeOurStory}/>
                </FeatureGate>
            ) : null}
            {showRsvpSection && themeRsvp !== null ? (
                <FeatureGate
                    capability="rsvp"
                    preview={
                        <SectionFeaturePreview
                            sectionId="rsvp"
                            theme={themeRsvp}
                            messageNamespace="rsvp"
                        />
                    }
                >
                    <RsvpSectionGate>
                        <RsvpSection theme={themeRsvp}/>
                    </RsvpSectionGate>
                </FeatureGate>
            ) : null}
            {showGallerySection && themeGallery !== null ? (
                <GalleryHomeGate theme={postRsvp.gallery}>
                    <GallerySection
                        presentation="preview"
                        theme={postRsvp.gallery}
                    />
                </GalleryHomeGate>
            ) : null}
            {showWishesSection && themeWishes !== null ? (
                <FeatureGate
                    capability="wishSubmit"
                    preview={
                        <SectionFeaturePreview
                            sectionId="wishes"
                            theme={postRsvp.wishes}
                            messageNamespace="wishes"
                        />
                    }
                >
                    <WishesSection
                        presentation="preview"
                        theme={postRsvp.wishes}
                    />
                </FeatureGate>
            ) : null}
            <DonateSection theme={postRsvp.donate}/>
            <ContactSection theme={postRsvp.contact}/>
        </>
    )
}
