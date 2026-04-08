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
                        <div className="mt-4 overflow-hidden rounded-card">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={w.photoUrl}
                                alt=""
                                loading="lazy"
                                className="max-h-64 w-full object-cover"
                            />
                        </div>
                    ) : null}
                </li>
            ))}
        </ul>
    );
}
