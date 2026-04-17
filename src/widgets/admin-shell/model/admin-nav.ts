/**
 * Primary admin shell navigation (paths are locale-agnostic; `next-intl` `Link` adds the prefix when needed).
 */
export const ADMIN_NAV_ITEMS = [
    {href: "/admin", navKey: "dashboard"},
    {href: "/admin/guests", navKey: "guests"},
    {href: "/admin/features", navKey: "features"},
    {href: "/admin/schedule", navKey: "schedule"},
    {href: "/admin/gallery", navKey: "gallery"},
    {href: "/admin/wishes", navKey: "wishes"},
    {href: "/admin/email", navKey: "email"},
    {href: "/admin/mail", navKey: "mail"},
] as const;

export type AdminNavKey = (typeof ADMIN_NAV_ITEMS)[number]["navKey"];
