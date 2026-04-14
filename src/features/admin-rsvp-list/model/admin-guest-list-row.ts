/**
 * One admin table row per `guest_accounts` row, with party fields from the parent `rsvp`.
 */
export type AdminGuestListRow = Readonly<{
    guestAccountId: string;
    displayName: string;
    isPrimary: boolean;
    sortOrder: number;
    attending: boolean;
    partyGuestCount: number;
    phone: string | null;
    dietary: string | null;
    message: string | null;
    /** Party inbox on `rsvp.email`; companion uses `guest_accounts.email` when set. */
    contactEmail: string | null;
    submittedAt: string;
}>;
