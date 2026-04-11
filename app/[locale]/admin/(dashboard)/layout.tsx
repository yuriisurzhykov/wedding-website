import {AdminShell} from '@widgets/admin-shell'
import type {ReactNode} from 'react'

type Props = Readonly<{
    children: ReactNode
}>

export default function AdminDashboardLayout({children}: Props) {
    return <AdminShell>{children}</AdminShell>
}
