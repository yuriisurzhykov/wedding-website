import type {Metadata} from "next";
import {Analytics} from "@vercel/analytics/next"
import "./globals.css";

export const metadata: Metadata = {
    title: "Wedding",
    description: "Wedding website",
};

export default function RootLayout(
    {children}: Readonly<{ children: React.ReactNode; }>
) {
    return (
        <html lang="en">
        <body className="min-h-dvh antialiased">{children}</body>
        </html>
    );
}
