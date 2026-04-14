import "server-only";

import type {GuestPartyMemberInput} from "@entities/guest-account";
import type {RsvpFormInput} from "@entities/rsvp";

function parseGuestCount(value: unknown): number | null {
    if (value === undefined || value === null || value === "") return null;
    const n = typeof value === "number" ? value : Number(value);
    return Number.isFinite(n) && Number.isInteger(n) && n >= 0 ? n : null;
}

/**
 * Guest count stored when attending (same default as {@link mapRsvpFormToRow}).
 */
function effectiveGuestCountWhenAttending(form: RsvpFormInput): number {
    return parseGuestCount(form.guestCount) ?? 1;
}

/**
 * Builds ordered party members for `guest_accounts` sync after an RSVP row is saved.
 * Primary is always first (`sort_order` 0); companions follow in form order.
 */
export function buildGuestPartyMemberInputsForPersist(
    form: RsvpFormInput,
): GuestPartyMemberInput[] {
    const displayName = String(form.name ?? "").trim();

    if (!form.attending) {
        return [
            {
                displayName,
                isPrimary: true,
                sortOrder: 0,
            },
        ];
    }

    const n = effectiveGuestCountWhenAttending(form);
    const companions = form.companionNames ?? [];
    const members: GuestPartyMemberInput[] = [
        {
            displayName,
            isPrimary: true,
            sortOrder: 0,
        },
    ];
    for (let i = 0; i < n - 1; i++) {
        members.push({
            displayName: companions[i] ?? "",
            isPrimary: false,
            sortOrder: i + 1,
        });
    }
    return members;
}
