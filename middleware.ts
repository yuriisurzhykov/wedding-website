import createMiddleware from "next-intl/middleware";
import {type NextRequest, NextResponse} from "next/server";

import {routing} from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

/** Value after "Bearer " (case-insensitive), trimmed. */
function parseBearerToken(auth: string | null): string {
    if (!auth) {
        return "";
    }
    const t = auth.trim();
    if (!/^Bearer\s+/i.test(t)) {
        return "";
    }
    return t.replace(/^Bearer\s+/i, "").trim();
}

function extractAdminCredential(request: NextRequest): string {
    const bearer = parseBearerToken(request.headers.get("authorization"));
    if (bearer) {
        return bearer;
    }
    const header = request.headers.get("x-admin-token")?.trim();
    if (header) {
        return header;
    }
    return request.nextUrl.searchParams.get("token")?.trim() ?? "";
}

function isAdminUiPath(pathname: string): boolean {
    if (pathname === "/admin" || pathname.startsWith("/admin/")) {
        return true;
    }
    return pathname.startsWith("/ru/admin") || pathname.startsWith("/en/admin");
}

/**
 * Returns an error response, or null when the caller may proceed (authorized).
 */
function assertAdminAccess(request: NextRequest): NextResponse | null {
    const pathname = request.nextUrl.pathname;
    const isApi = pathname.startsWith("/api/admin");

    const expected = process.env.ADMIN_SECRET?.trim() ?? "";
    if (!expected) {
        if (isApi) {
            return NextResponse.json(
                {error: "ADMIN_SECRET is not configured"},
                {status: 500},
            );
        }
        return NextResponse.redirect(new URL("/", request.url));
    }

    const token = extractAdminCredential(request);
    if (token === expected) {
        return null;
    }

    if (isApi) {
        return NextResponse.json({error: "Unauthorized"}, {status: 401});
    }

    return NextResponse.redirect(new URL("/", request.url));
}

export default function middleware(request: NextRequest) {
    const pathname = request.nextUrl.pathname;

    if (pathname.startsWith("/api/admin")) {
        const denied = assertAdminAccess(request);
        if (denied) {
            return denied;
        }
        return NextResponse.next();
    }

    if (isAdminUiPath(pathname)) {
        const denied = assertAdminAccess(request);
        if (denied) {
            return denied;
        }
    }

    return intlMiddleware(request);
}

export const config = {
    matcher: [
        "/((?!api|_next|_vercel|.*\\..*).*)",
        "/api/admin/:path*",
    ],
};
