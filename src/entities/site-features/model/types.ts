/**
 * Toggleable product areas. Extend the union when adding a new flag-driven feature.
 */
export type SiteFeatureId = 'ourStory'

export type SiteFeatures = Record<SiteFeatureId, boolean>
