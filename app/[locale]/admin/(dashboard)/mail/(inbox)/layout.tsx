import {AdminMailListSection} from "@widgets/admin-mail";
import type {ReactNode} from "react";
import {Suspense} from "react";

export default function AdminMailInboxSplitLayout({children}: Readonly<{children: ReactNode}>) {
    return (
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
            <aside className="w-full shrink-0 lg:sticky lg:top-8 lg:w-80">
                <Suspense
                    fallback={
                        <div
                            className="h-40 animate-pulse rounded-lg border border-border bg-bg-section"
                            aria-hidden
                        />
                    }
                >
                    <AdminMailListSection />
                </Suspense>
            </aside>
            <div className="min-w-0 flex-1">{children}</div>
        </div>
    );
}
