import "server-only";

import {NextResponse} from "next/server";

import {ADMIN_SESSION_COOKIE_NAME} from "../lib/constants";

/** Clears the httpOnly admin session cookie. */
export function performAdminLogout(): NextResponse {
    const res = NextResponse.json({ok: true});
    res.cookies.set(ADMIN_SESSION_COOKIE_NAME, "", {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 0,
        secure: process.env.NODE_ENV === "production",
    });
    return res;
}
