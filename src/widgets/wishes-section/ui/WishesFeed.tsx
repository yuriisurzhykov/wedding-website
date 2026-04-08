import type {WishView} from "@entities/wish";

export function WishesFeed({wishes}: {wishes: WishView[]}) {
    if (wishes.length === 0) {
        return null;
    }

    return (
        <ul className="mt-10 flex flex-col gap-6">
            {wishes.map((w) => (
                <li
                    key={w.id}
                    className="rounded-card border border-border bg-bg-section p-5 shadow-card"
                >
                    <p className="font-medium text-text-primary">{w.authorName}</p>
                    <p className="mt-2 whitespace-pre-wrap text-body text-text-secondary">
                        {w.message}
                    </p>
                    {w.photoUrl ? (
                        <div className="relative mt-4 overflow-hidden rounded-card">
                            {/* eslint-disable-next-line @next/next/no-img-element -- same URL as foreground; browser cache */}
                            <img
                                src={w.photoUrl}
                                alt=""
                                aria-hidden
                                loading="lazy"
                                decoding="async"
                                className="pointer-events-none absolute inset-0 z-0 h-full w-full origin-center scale-110 object-cover blur-3xl brightness-90 saturate-150"
                            />
                            <div className="relative z-10 flex justify-center p-2 sm:p-3">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={w.photoUrl}
                                    alt=""
                                    loading="lazy"
                                    decoding="async"
                                    className="relative h-auto max-h-72 w-auto max-w-full object-contain sm:max-h-96"
                                />
                            </div>
                        </div>
                    ) : null}
                </li>
            ))}
        </ul>
    );
}
