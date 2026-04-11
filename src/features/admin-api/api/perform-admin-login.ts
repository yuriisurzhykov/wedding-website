import "server-only";

import {compare} from "bcryptjs";
import {NextResponse} from "next/server";

import {ADMIN_SESSION_COOKIE_NAME, signAdminSessionJwt} from "@features/admin-api";
import {fetchAdminPasswordHashFromDatabase} from "../lib/fetch-admin-password-hash";

import type {AdminLoginBody} from "./admin-login-body";

const NOT_CONFIGURED_MSG =
    "Admin password is not set in the database. Apply migrations, then run: npm run admin:set-password -- <password> (requires SUPABASE_SERVICE_ROLE_KEY in .env).";

/**
 * Validates password against `admin_site_credential.password_hash` (bcrypt) and returns a `Set-Cookie` response body.
 *
 * @returns 401 on bad password, 503 if no credential row, 500 on DB or session misconfiguration.
 */
export async function performAdminLogin(
    body: AdminLoginBody,
): Promise<NextResponse> {
    let hash: string | null;
    try {
        hash = await fetchAdminPasswordHashFromDatabase();
    } catch (e) {
        const msg =
            e instanceof Error ? e.message : "Failed to read admin credential";
        if (process.env.NODE_ENV === "development") {
            console.warn("[performAdminLogin] admin_site_credential read:", msg);
        }
        return NextResponse.json(
            {error: `Admin login database error: ${msg}`},
            {status: 500},
        );
    }

    if (hash === null) {
        if (process.env.NODE_ENV === "development") {
            console.warn("[performAdminLogin]", NOT_CONFIGURED_MSG);
        }
        return NextResponse.json({error: NOT_CONFIGURED_MSG}, {status: 503});
    }

    const plain = body.password.trim();
    const ok = await compare(plain, hash);
    if (!ok) {
        return NextResponse.json({error: "Invalid credentials"}, {status: 401});
    }

    let token: string;
    try {
        token = await signAdminSessionJwt();
    } catch (err) {
        if (process.env.NODE_ENV === "development") {
            const msg = err instanceof Error ? err.message : String(err);
            console.warn(
                "[performAdminLogin] JWT sign failed (ADMIN_SESSION_SECRET?):",
                msg,
            );
        }
        return NextResponse.json(
            {error: "Admin session signing is not configured"},
            {status: 500},
        );
    }

    const maxAge = 60 * 60 * 24 * 7;
    const res = NextResponse.json({ok: true});
    res.cookies.set(ADMIN_SESSION_COOKIE_NAME, token, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge,
        secure: process.env.NODE_ENV === "production",
    });
    return res;
}
