import type {ReactNode} from "react";

type Props = Readonly<{
    title: string;
    subtitle?: string;
    children: ReactNode;
}>;

export function AdminGuestsSectionShell({title, subtitle, children}: Props) {
    return (
        <section className="rounded-lg border border-border bg-bg-card p-6 shadow-card">
            <h1 className="font-display text-h2 text-text-primary">{title}</h1>
            {subtitle ? (
                <p className="mt-2 text-body text-text-secondary">{subtitle}</p>
            ) : null}
            {children}
        </section>
    );
}
