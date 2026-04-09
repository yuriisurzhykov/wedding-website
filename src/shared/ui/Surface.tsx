import type {HTMLAttributes, ReactNode} from "react";

import {cn} from "@shared/lib/cn";

export type SurfaceVariant = "raised" | "muted";

const variantClass: Record<SurfaceVariant, string> = {
    /** White card on section background — forms, callouts that should read as a “tile”. */
    raised: cn(
        "rounded-lg border border-border bg-bg-card p-6 shadow-card",
    ),
    /** Softer panel on `bg-bg-section` — nested notices, low emphasis. */
    muted: "rounded-lg border border-border bg-bg-section p-4",
};

type SurfaceProps = {
    variant?: SurfaceVariant;
    className?: string;
    children: ReactNode;
} & Omit<HTMLAttributes<HTMLDivElement>, "className" | "children">;

/**
 * Shared elevated / inset panel using design tokens (`globals.css` @theme).
 * Prefer this over ad-hoc `rounded-* border bg-*` on each screen.
 */
export function Surface({
    variant = "raised",
    className,
    children,
    ...rest
}: SurfaceProps) {
    return (
        <div className={cn(variantClass[variant], className)} {...rest}>
            {children}
        </div>
    );
}
