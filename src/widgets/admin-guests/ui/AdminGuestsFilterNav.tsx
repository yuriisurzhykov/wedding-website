import {Link} from "@/i18n/navigation";
import {cn} from "@shared/lib/cn";
import type {ReactNode} from "react";

import type {AdminGuestsFilterKey} from "../lib/admin-guests-filter";

function FilterLink({
    href,
    active,
    children,
}: Readonly<{
    href: string;
    active: boolean;
    children: ReactNode;
}>) {
    return (
        <Link
            href={href}
            className={cn(
                "rounded-md px-3 py-1.5 text-small transition-colors",
                active
                    ? "bg-primary text-text-on-primary shadow-button"
                    : "border border-border bg-bg-base text-text-secondary hover:bg-bg-section hover:text-text-primary",
            )}
            aria-current={active ? "true" : undefined}
        >
            {children}
        </Link>
    );
}

type Props = Readonly<{
    filter: AdminGuestsFilterKey;
    filtersAriaLabel: string;
    labelAll: string;
    labelAttending: string;
    labelNotAttending: string;
}>;

export function AdminGuestsFilterNav({
    filter,
    filtersAriaLabel,
    labelAll,
    labelAttending,
    labelNotAttending,
}: Props) {
    return (
        <nav
            className="mt-6 flex flex-wrap gap-2"
            aria-label={filtersAriaLabel}
        >
            <FilterLink href="/admin/guests" active={filter === "all"}>
                {labelAll}
            </FilterLink>
            <FilterLink
                href="/admin/guests?attending=true"
                active={filter === "attending"}
            >
                {labelAttending}
            </FilterLink>
            <FilterLink
                href="/admin/guests?attending=false"
                active={filter === "notAttending"}
            >
                {labelNotAttending}
            </FilterLink>
        </nav>
    );
}
