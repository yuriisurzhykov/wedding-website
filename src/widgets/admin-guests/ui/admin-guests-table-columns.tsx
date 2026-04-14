import type {AdminGuestListRow} from "@features/admin-rsvp-list";
import type {ReactNode} from "react";

/** Scoped `getTranslations('admin.guests')` return value. */
export type AdminGuestsTranslator = (key: string) => string;

export type AdminGuestsTableCellContext = Readonly<{
    t: AdminGuestsTranslator;
    dateFormatter: Intl.DateTimeFormat;
    emptyDisplay: string;
}>;

export type AdminGuestTableColumn = Readonly<{
    id: string;
    /** Key under `admin.guests` (e.g. `columns.displayName`). */
    headerKey: string;
    tdClassName?: string;
    renderCell: (
        row: AdminGuestListRow,
        ctx: AdminGuestsTableCellContext,
    ) => ReactNode;
}>;

function textOrEmpty(value: string | null, emptyDisplay: string): string {
    if (value === null || value === "") {
        return emptyDisplay;
    }
    return value;
}

export const ADMIN_GUEST_TABLE_COLUMNS: AdminGuestTableColumn[] = [
    {
        id: "displayName",
        headerKey: "columns.displayName",
        tdClassName: "py-3 text-text-primary",
        renderCell: (row, {emptyDisplay}) =>
            textOrEmpty(row.displayName, emptyDisplay),
    },
    {
        id: "role",
        headerKey: "columns.role",
        tdClassName: "py-3 text-text-secondary",
        renderCell: (row, {t}) =>
            row.isPrimary ? t("rolePrimary") : t("roleCompanion"),
    },
    {
        id: "contactEmail",
        headerKey: "columns.contactEmail",
        tdClassName: "py-3 text-text-secondary",
        renderCell: (row, {emptyDisplay}) =>
            textOrEmpty(row.contactEmail, emptyDisplay),
    },
    {
        id: "phone",
        headerKey: "columns.phone",
        tdClassName: "py-3 text-text-secondary",
        renderCell: (row, {emptyDisplay}) => textOrEmpty(row.phone, emptyDisplay),
    },
    {
        id: "attending",
        headerKey: "columns.attending",
        tdClassName: "py-3 text-text-secondary",
        renderCell: (row, {t}) =>
            row.attending ? t("attendingYes") : t("attendingNo"),
    },
    {
        id: "partyGuestCount",
        headerKey: "columns.partyGuestCount",
        tdClassName: "py-3 text-text-secondary tabular-nums",
        renderCell: (row, {emptyDisplay}) =>
            row.isPrimary ? String(row.partyGuestCount) : emptyDisplay,
    },
    {
        id: "dietary",
        headerKey: "columns.dietary",
        tdClassName: "max-w-[12rem] py-3 text-text-secondary",
        renderCell: (row, {emptyDisplay}) => (
            <span className="line-clamp-3 whitespace-pre-wrap break-words">
                {textOrEmpty(row.dietary, emptyDisplay)}
            </span>
        ),
    },
    {
        id: "message",
        headerKey: "columns.message",
        tdClassName: "max-w-[16rem] py-3 text-text-secondary",
        renderCell: (row, {emptyDisplay}) => (
            <span className="line-clamp-3 whitespace-pre-wrap break-words">
                {textOrEmpty(row.message, emptyDisplay)}
            </span>
        ),
    },
    {
        id: "submittedAt",
        headerKey: "columns.submittedAt",
        tdClassName: "py-3 text-text-secondary whitespace-nowrap",
        renderCell: (row, {dateFormatter}) =>
            dateFormatter.format(new Date(row.submittedAt)),
    },
];
