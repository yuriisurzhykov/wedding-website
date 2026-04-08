/**
 * Single source of truth for primary nav order and targets.
 * Menu labels use `navKey` under the `nav` namespace in messages.
 */
export const SITE_NAV_REGISTRY = [
    {kind: 'section', navKey: 'schedule', sectionId: 'schedule'},
    {kind: 'section', navKey: 'dresscode', sectionId: 'dresscode'},
    {kind: 'section', navKey: 'story', sectionId: 'story'},
    {kind: 'section', navKey: 'rsvp', sectionId: 'rsvp'},
    {kind: 'route', navKey: 'gallery', pathname: '/gallery'},
    {kind: 'route', navKey: 'wishes', pathname: '/wishes'},
    {kind: 'section', navKey: 'donate', sectionId: 'donate'},
] as const

export type SiteNavRegistryEntry = (typeof SITE_NAV_REGISTRY)[number]

export type SiteNavNavKey = SiteNavRegistryEntry['navKey']

type RouteEntries = Extract<SiteNavRegistryEntry, { kind: 'route' }>

/** Pathnames registered as top-level app routes under `app/[locale]/`. */
export type AppRoutePathname = RouteEntries['pathname']

export function isRouteNavEntry(
    entry: SiteNavRegistryEntry,
): entry is RouteEntries {
    return entry.kind === 'route'
}

export function isSectionNavEntry(
    entry: SiteNavRegistryEntry,
): entry is Extract<SiteNavRegistryEntry, { kind: 'section' }> {
    return entry.kind === 'section'
}
