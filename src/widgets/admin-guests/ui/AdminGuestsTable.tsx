import type {AdminGuestListRow} from "@features/admin-rsvp-list";
import {cn} from "@shared/lib/cn";

import {
    ADMIN_GUEST_TABLE_COLUMNS,
    type AdminGuestsTableCellContext,
    type AdminGuestsTranslator,
} from "./admin-guests-table-columns";

type Props = Readonly<{
    rows: AdminGuestListRow[];
    t: AdminGuestsTranslator;
    dateFormatter: Intl.DateTimeFormat;
    emptyDisplay: string;
}>;

export function AdminGuestsTable({
    rows,
    t,
    dateFormatter,
    emptyDisplay,
}: Props) {
    const ctx: AdminGuestsTableCellContext = {
        t,
        dateFormatter,
        emptyDisplay,
    };

    return (
        <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[800px] border-collapse text-left text-body">
                <thead>
                    <tr className="border-b border-border text-small text-text-muted">
                        {ADMIN_GUEST_TABLE_COLUMNS.map((col, colIndex) => (
                            <th
                                key={col.id}
                                className={cn(
                                    "py-2 font-medium",
                                    colIndex < ADMIN_GUEST_TABLE_COLUMNS.length - 1 &&
                                        "pr-4",
                                )}
                            >
                                {t(col.headerKey)}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <tr
                            key={row.guestAccountId}
                            className="border-b border-border/80 align-top last:border-0"
                        >
                            {ADMIN_GUEST_TABLE_COLUMNS.map((col, colIndex) => (
                                <td
                                    key={col.id}
                                    className={cn(
                                        col.tdClassName,
                                        colIndex <
                                            ADMIN_GUEST_TABLE_COLUMNS.length - 1 &&
                                            "pr-4",
                                    )}
                                >
                                    {col.renderCell(row, ctx)}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
