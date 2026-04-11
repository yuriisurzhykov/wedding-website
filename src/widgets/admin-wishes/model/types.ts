import type {AdminWishRow} from "@features/admin-wishes-delete";

export type AdminWishesTableRow = AdminWishRow & {
    createdAtLabel: string;
};
