import {AdminMailInboxChrome} from "@widgets/admin-mail";
import type {ReactNode} from "react";

export default async function AdminMailLayout({children}: Readonly<{children: ReactNode}>) {
    return <AdminMailInboxChrome>{children}</AdminMailInboxChrome>;
}
