import type {SectionTheme} from '@shared/ui/Section'

/**
 * Alternating section backgrounds (`base` → `alt`) for `<Section>` blocks after the hero.
 * The home page passes **consecutive indices in render order** (0-based), skipping optional
 * sections so the pattern stays consistent when a feature (e.g. Our Story) is off.
 */
export function homeSectionThemeAt(slot: number): SectionTheme {
    return slot % 2 === 0 ? 'base' : 'alt'
}

/** Swap `base` ↔ `alt` for visual band parity (`dark` unchanged). */
export function invertHomeSectionBand(theme: SectionTheme): SectionTheme {
    if (theme === 'dark') {
        return theme
    }
    return theme === 'base' ? 'alt' : 'base'
}

/**
 * When the home RSVP block is not in the DOM (signed-in guest), its background band is missing
 * while slot-based themes still assumed it. Flip post-RSVP section themes so stripes alternate on screen.
 */
export function alignHomeThemesAfterSkippedRsvpBand(
    rsvpSlotSkipped: boolean,
    post: {
        gallery: SectionTheme
        wishes: SectionTheme
        donate: SectionTheme
        contact: SectionTheme
    },
): {
    gallery: SectionTheme
    wishes: SectionTheme
    donate: SectionTheme
    contact: SectionTheme
} {
    if (!rsvpSlotSkipped) {
        return post
    }
    return {
        gallery: invertHomeSectionBand(post.gallery),
        wishes: invertHomeSectionBand(post.wishes),
        donate: invertHomeSectionBand(post.donate),
        contact: invertHomeSectionBand(post.contact),
    }
}
