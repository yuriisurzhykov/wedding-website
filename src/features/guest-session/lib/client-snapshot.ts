import type {GuestViewerSnapshot} from "@entities/guest-viewer";
import {buildGuestViewerSnapshot, maskEmailForDisplay} from "@entities/guest-viewer";

/**
 * §4 JSON shape for guest session responses — **alias** of {@link GuestViewerSnapshot}.
 * Prefer importing `GuestViewerSnapshot` from `@entities/guest-viewer` for new code outside this feature.
 */
export type GuestSessionClientSnapshot = GuestViewerSnapshot;

export {maskEmailForDisplay};

/**
 * Builds the `session` object from RSVP identity fields (no token).
 */
export function buildGuestSessionClientSnapshot(
    input: Parameters<typeof buildGuestViewerSnapshot>[0],
): GuestSessionClientSnapshot {
    return buildGuestViewerSnapshot(input);
}
