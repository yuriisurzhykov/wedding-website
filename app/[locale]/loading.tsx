/**
 * Shown during segment transitions (e.g. home → gallery) until the next page shell streams.
 */
export default function LocaleSegmentLoading() {
    return (
        <div className="w-full px-4 pt-8 pb-16 sm:px-8">
            <div className="mx-auto flex max-w-[var(--content-width)] flex-col gap-6">
                <div className="space-y-3">
                    <div
                        className="mx-auto h-9 w-48 max-w-full animate-pulse rounded-md bg-bg-section"
                        aria-hidden
                    />
                    <div
                        className="mx-auto h-4 w-full max-w-md animate-pulse rounded-md bg-bg-section"
                        aria-hidden
                    />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div
                        className="h-28 animate-pulse rounded-lg bg-bg-section shadow-sm"
                        aria-hidden
                    />
                    <div
                        className="h-28 animate-pulse rounded-lg bg-bg-section shadow-sm"
                        aria-hidden
                    />
                </div>
                <div className="space-y-3">
                    <div
                        className="h-4 w-full animate-pulse rounded-md bg-bg-section"
                        aria-hidden
                    />
                    <div
                        className="h-4 w-[92%] animate-pulse rounded-md bg-bg-section"
                        aria-hidden
                    />
                    <div
                        className="h-4 w-[78%] animate-pulse rounded-md bg-bg-section"
                        aria-hidden
                    />
                </div>
            </div>
        </div>
    )
}
