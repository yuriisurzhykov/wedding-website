export type AdminGuestsFilterKey = "all" | "attending" | "notAttending";

export function adminGuestsFilterToAttending(
    key: AdminGuestsFilterKey,
): boolean | undefined {
    if (key === "all") {
        return undefined;
    }
    return key === "attending";
}
