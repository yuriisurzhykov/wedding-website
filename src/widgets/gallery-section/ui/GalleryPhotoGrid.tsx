import type {GalleryPhotoView} from "@entities/photo";

export function GalleryPhotoGrid({photos}: {photos: GalleryPhotoView[]}) {
    if (photos.length === 0) {
        return null;
    }

    return (
        <ul
            className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 md:gap-4"
            aria-label="Gallery photos"
        >
            {photos.map((p) => (
                <li
                    key={p.id}
                    className="aspect-square overflow-hidden rounded-card bg-bg-section shadow-card"
                >
                    {/* eslint-disable-next-line @next/next/no-img-element -- R2 public URLs; no remotePatterns */}
                    <img
                        src={p.publicUrl}
                        alt=""
                        loading="lazy"
                        className="size-full object-cover"
                    />
                </li>
            ))}
        </ul>
    );
}
