import type {AdminGuestListRow} from "../model/admin-guest-list-row";

function submittedAtMs(value: string): number {
    const t = Date.parse(value);
    return Number.isFinite(t) ? t : 0;
}

/**
 * Orders rows by party (`submittedAt` / `rsvp.created_at` descending), then by `sortOrder` ascending within a party.
 */
export function sortAdminGuestRowsByParty(
    rows: readonly AdminGuestListRow[],
): AdminGuestListRow[] {
    return [...rows].sort((a, b) => {
        const tb = submittedAtMs(b.submittedAt);
        const ta = submittedAtMs(a.submittedAt);
        if (tb !== ta) {
            return tb - ta;
        }
        if (a.sortOrder !== b.sortOrder) {
            return a.sortOrder - b.sortOrder;
        }
        return a.guestAccountId.localeCompare(b.guestAccountId);
    });
}
