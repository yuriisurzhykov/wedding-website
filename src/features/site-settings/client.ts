/**
 * Client-only entry: provider and gates. Do not import `@features/site-settings` server APIs from client components.
 */

export type {SiteCapabilitiesContextValue} from './ui/SiteCapabilitiesProvider'
export {
    FeatureGate,
} from './ui/FeatureGate'
export {GalleryHomeGate} from './ui/GalleryHomeGate'
export type {FeaturePreviewMessageNamespace} from './ui/SectionFeaturePreview'
export {SectionFeaturePreview} from './ui/SectionFeaturePreview'
export {
    SITE_SETTINGS_PUBLIC_API_PATH,
    SiteCapabilitiesProvider,
    useSiteCapabilities,
} from './ui/SiteCapabilitiesProvider'
